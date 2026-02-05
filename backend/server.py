from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'intraamvali-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Portal IntraAMVALI", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== ENUMS ====================
class UserRole(str, Enum):
    MUNICIPAL = "municipal"
    GESTOR_AMVALI = "gestor_amvali"
    TECNICO_AMVALI = "tecnico_amvali"

class ProjectStatus(str, Enum):
    RASCUNHO = "rascunho"
    SOLICITACAO = "solicitacao"
    BRIEFING = "briefing"
    DIAGNOSTICO = "diagnostico"
    VALIDACAO = "validacao"
    EXECUCAO = "execucao"
    ENTREGA = "entrega"
    CONCLUIDO = "concluido"
    PAUSADO = "pausado"

class ProjectType(str, Enum):
    PAVIMENTACAO = "pavimentacao"
    EDIFICACAO = "edificacao"
    INFRAESTRUTURA = "infraestrutura"

class Complexity(str, Enum):
    MINIMA = "minima"
    MEDIA = "media"
    ALTA = "alta"

class Priority(int, Enum):
    MAXIMA = 5
    ALTA = 4
    NORMAL = 3
    BAIXA = 2
    MUITO_BAIXA = 1

# ==================== MODELS ====================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.MUNICIPAL
    municipality_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: UserRole
    municipality_id: Optional[str] = None
    specialties: List[str] = []
    workload_hours: int = 40
    active_projects: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Municipality(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    engagement_score: float = 0.0
    meeting_participations: int = 0
    clarity_score: float = 0.0
    financial_regularity: bool = True
    total_projects: int = 0
    completed_projects: int = 0
    active_stars: Dict[str, int] = {}  # {area_tecnica: soma_estrelas}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MunicipalityCreate(BaseModel):
    name: str
    code: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None

class ProjectStage(BaseModel):
    name: str
    status: str = "pending"  # pending, in_progress, completed
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    project_type: ProjectType
    municipality_id: str
    municipality_name: str
    priority: int = 3
    complexity: Optional[Complexity] = None
    status: ProjectStatus = ProjectStatus.RASCUNHO
    assigned_team: List[str] = []
    stages: List[ProjectStage] = []
    location: Optional[str] = None
    scope: Optional[str] = None
    purpose: Optional[str] = None
    estimated_deadline: Optional[datetime] = None
    actual_deadline: Optional[datetime] = None
    progress_percent: float = 0.0
    ipr_score: float = 0.0
    impact_score: int = 1
    urgency_score: int = 1
    cost_score: int = 1
    documents: List[str] = []
    ai_diagnosis: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DesiredDeadline(str, Enum):
    BAIXO = "baixo"
    MEDIO = "medio"
    ALTO = "alto"

class InformationSufficiency(str, Enum):
    SUFICIENTE = "suficiente"
    PARCIALMENTE_SUFICIENTE = "parcialmente_suficiente"
    INSUFICIENTE = "insuficiente"

class ProjectAttachment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    file_type: str
    file_size: int
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AIAnalysis(BaseModel):
    information_sufficiency: InformationSufficiency = InformationSufficiency.PARCIALMENTE_SUFICIENTE
    missing_documents: List[str] = []
    estimated_complexity: Optional[Complexity] = None
    deadline_compatibility: Optional[str] = None
    suggested_deadline_days: Optional[int] = None
    technical_explanation: Optional[str] = None
    analysis_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    title: str
    description: str
    project_type: ProjectType
    municipality_id: str
    priority: int = 3
    location: Optional[str] = None
    scope: Optional[str] = None
    purpose: Optional[str] = None
    impact_score: int = 1
    urgency_score: int = 1
    cost_score: int = 1
    desired_deadline: DesiredDeadline = DesiredDeadline.MEDIO

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    status: Optional[ProjectStatus] = None
    complexity: Optional[Complexity] = None
    assigned_team: Optional[List[str]] = None
    progress_percent: Optional[float] = None
    estimated_deadline: Optional[datetime] = None
    location: Optional[str] = None
    scope: Optional[str] = None
    purpose: Optional[str] = None
    impact_score: Optional[int] = None
    urgency_score: Optional[int] = None
    cost_score: Optional[int] = None

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    notification_type: str = "info"
    read: bool = False
    project_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TeamMember(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    specialties: List[str]
    workload_hours: int
    active_projects: int
    capacity_percent: float
    assigned_projects: List[Dict[str, Any]]

# ==================== AUTH HELPERS ====================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== IPR CALCULATION ====================
def calculate_ipr(impact: int, urgency: int, cost: int, complexity: Complexity) -> float:
    complexity_divisor = {"minima": 1, "media": 5, "alta": 10}.get(complexity, 5)
    return ((impact * 3) + (urgency * 2) + (cost * 1)) / complexity_divisor

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        municipality_id=user_data.municipality_id
    )
    user_dict = user.model_dump()
    user_dict['password_hash'] = hash_password(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    token = create_token(user.id, user.role)
    
    return {"token": token, "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role}}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get('password_hash', '')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['role'])
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "email": user['email'],
            "name": user['name'],
            "role": user['role'],
            "municipality_id": user.get('municipality_id')
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ==================== MUNICIPALITY ROUTES ====================
@api_router.post("/municipalities", response_model=Municipality)
async def create_municipality(data: MunicipalityCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in [UserRole.GESTOR_AMVALI]:
        raise HTTPException(status_code=403, detail="Only AMVALI managers can create municipalities")
    
    municipality = Municipality(**data.model_dump())
    doc = municipality.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.municipalities.insert_one(doc)
    return municipality

@api_router.get("/municipalities", response_model=List[Municipality])
async def list_municipalities(current_user: dict = Depends(get_current_user)):
    municipalities = await db.municipalities.find({}, {"_id": 0}).to_list(1000)
    for m in municipalities:
        if isinstance(m.get('created_at'), str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
    return municipalities

@api_router.get("/municipalities/{municipality_id}")
async def get_municipality(municipality_id: str, current_user: dict = Depends(get_current_user)):
    municipality = await db.municipalities.find_one({"id": municipality_id}, {"_id": 0})
    if not municipality:
        raise HTTPException(status_code=404, detail="Municipality not found")
    return municipality

@api_router.put("/municipalities/{municipality_id}/engagement")
async def update_engagement(municipality_id: str, engagement_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in [UserRole.GESTOR_AMVALI]:
        raise HTTPException(status_code=403, detail="Only AMVALI managers can update engagement")
    
    await db.municipalities.update_one(
        {"id": municipality_id},
        {"$set": {
            "engagement_score": engagement_data.get('engagement_score', 0),
            "meeting_participations": engagement_data.get('meeting_participations', 0),
            "clarity_score": engagement_data.get('clarity_score', 0)
        }}
    )
    return {"message": "Engagement updated"}

# ==================== PROJECT ROUTES ====================
@api_router.post("/projects", response_model=Project)
async def create_project(data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    municipality = await db.municipalities.find_one({"id": data.municipality_id}, {"_id": 0})
    if not municipality:
        raise HTTPException(status_code=404, detail="Municipality not found")
    
    # Check star limits
    area = data.project_type
    current_stars = municipality.get('active_stars', {}).get(area, 0)
    if current_stars + data.priority > 5:
        raise HTTPException(
            status_code=400, 
            detail=f"Star limit exceeded. Current: {current_stars}, Requested: {data.priority}, Max: 5"
        )
    
    # Check simultaneous projects limit based on priority
    priority_limits = {5: 1, 4: 2, 3: 3, 2: 4, 1: 5}
    active_count = await db.projects.count_documents({
        "municipality_id": data.municipality_id,
        "priority": data.priority,
        "status": {"$nin": [ProjectStatus.CONCLUIDO, ProjectStatus.RASCUNHO]}
    })
    if active_count >= priority_limits.get(data.priority, 5):
        raise HTTPException(status_code=400, detail=f"Maximum simultaneous projects reached for priority {data.priority}")
    
    # Create default stages
    default_stages = [
        ProjectStage(name="Solicitação Formal"),
        ProjectStage(name="Briefing Técnico"),
        ProjectStage(name="Diagnóstico de Complexidade"),
        ProjectStage(name="Validação Conjunta"),
        ProjectStage(name="Execução"),
        ProjectStage(name="Entrega e Encerramento")
    ]
    
    project = Project(
        title=data.title,
        description=data.description,
        project_type=data.project_type,
        municipality_id=data.municipality_id,
        municipality_name=municipality['name'],
        priority=data.priority,
        location=data.location,
        scope=data.scope,
        purpose=data.purpose,
        impact_score=data.impact_score,
        urgency_score=data.urgency_score,
        cost_score=data.cost_score,
        stages=[s.model_dump() for s in default_stages]
    )
    
    doc = project.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.projects.insert_one(doc)
    
    # Update municipality star count
    await db.municipalities.update_one(
        {"id": data.municipality_id},
        {"$inc": {f"active_stars.{area}": data.priority, "total_projects": 1}}
    )
    
    return project

@api_router.get("/projects", response_model=List[Project])
async def list_projects(
    status: Optional[str] = None,
    municipality_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query['status'] = status
    if municipality_id:
        query['municipality_id'] = municipality_id
    elif current_user['role'] == UserRole.MUNICIPAL:
        query['municipality_id'] = current_user.get('municipality_id')
    
    projects = await db.projects.find(query, {"_id": 0}).sort("ipr_score", -1).to_list(1000)
    for p in projects:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
        if isinstance(p.get('updated_at'), str):
            p['updated_at'] = datetime.fromisoformat(p['updated_at'])
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, data: ProjectUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Recalculate IPR if relevant fields changed
    if any(k in update_data for k in ['impact_score', 'urgency_score', 'cost_score', 'complexity']):
        project = await db.projects.find_one({"id": project_id}, {"_id": 0})
        if project:
            complexity = update_data.get('complexity', project.get('complexity', 'media'))
            impact = update_data.get('impact_score', project.get('impact_score', 1))
            urgency = update_data.get('urgency_score', project.get('urgency_score', 1))
            cost = update_data.get('cost_score', project.get('cost_score', 1))
            update_data['ipr_score'] = calculate_ipr(impact, urgency, cost, complexity)
    
    await db.projects.update_one({"id": project_id}, {"$set": update_data})
    return await db.projects.find_one({"id": project_id}, {"_id": 0})

@api_router.put("/projects/{project_id}/stage")
async def update_project_stage(project_id: str, stage_data: dict, current_user: dict = Depends(get_current_user)):
    stage_index = stage_data.get('stage_index')
    new_status = stage_data.get('status')
    
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    stages = project.get('stages', [])
    if stage_index < 0 or stage_index >= len(stages):
        raise HTTPException(status_code=400, detail="Invalid stage index")
    
    stages[stage_index]['status'] = new_status
    if new_status == 'in_progress' and not stages[stage_index].get('started_at'):
        stages[stage_index]['started_at'] = datetime.now(timezone.utc).isoformat()
    elif new_status == 'completed':
        stages[stage_index]['completed_at'] = datetime.now(timezone.utc).isoformat()
    
    # Calculate progress
    completed = sum(1 for s in stages if s['status'] == 'completed')
    progress = (completed / len(stages)) * 100
    
    # Update project status based on stage
    status_map = {
        0: ProjectStatus.SOLICITACAO,
        1: ProjectStatus.BRIEFING,
        2: ProjectStatus.DIAGNOSTICO,
        3: ProjectStatus.VALIDACAO,
        4: ProjectStatus.EXECUCAO,
        5: ProjectStatus.ENTREGA
    }
    new_project_status = status_map.get(stage_index, project.get('status'))
    if completed == len(stages):
        new_project_status = ProjectStatus.CONCLUIDO
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {
            "stages": stages,
            "progress_percent": progress,
            "status": new_project_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create notification
    notification = Notification(
        user_id=project.get('municipality_id', ''),
        title=f"Etapa atualizada: {stages[stage_index]['name']}",
        message=f"O projeto '{project['title']}' avançou para a etapa '{stages[stage_index]['name']}'",
        notification_type="info",
        project_id=project_id
    )
    notif_doc = notification.model_dump()
    notif_doc['created_at'] = notif_doc['created_at'].isoformat()
    await db.notifications.insert_one(notif_doc)
    
    return {"message": "Stage updated", "progress": progress}

# ==================== QUEUE ROUTES ====================
@api_router.get("/queue")
async def get_technical_queue(current_user: dict = Depends(get_current_user)):
    projects = await db.projects.find(
        {"status": {"$in": [ProjectStatus.VALIDACAO, ProjectStatus.EXECUCAO]}},
        {"_id": 0}
    ).sort([("ipr_score", -1), ("priority", -1), ("created_at", 1)]).to_list(100)
    
    return {"queue": projects, "total": len(projects)}

@api_router.post("/queue/reorder")
async def reorder_queue(order_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in [UserRole.GESTOR_AMVALI]:
        raise HTTPException(status_code=403, detail="Only AMVALI managers can reorder queue")
    
    # Manual reorder logic here
    return {"message": "Queue reordered"}

# ==================== TEAM ROUTES ====================
@api_router.get("/team")
async def get_team(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in [UserRole.GESTOR_AMVALI, UserRole.TECNICO_AMVALI]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    technicians = await db.users.find(
        {"role": UserRole.TECNICO_AMVALI},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    
    team_members = []
    for tech in technicians:
        # Get assigned projects
        assigned = await db.projects.find(
            {"assigned_team": tech['id'], "status": {"$nin": [ProjectStatus.CONCLUIDO]}},
            {"_id": 0, "id": 1, "title": 1, "priority": 1, "status": 1}
        ).to_list(20)
        
        capacity = min(100, (tech.get('active_projects', 0) / max(tech.get('workload_hours', 40) / 8, 1)) * 100)
        
        team_members.append({
            "id": tech['id'],
            "name": tech['name'],
            "email": tech['email'],
            "specialties": tech.get('specialties', []),
            "workload_hours": tech.get('workload_hours', 40),
            "active_projects": len(assigned),
            "capacity_percent": capacity,
            "assigned_projects": assigned
        })
    
    return {"team": team_members, "total": len(team_members)}

@api_router.post("/team/allocate")
async def allocate_team(allocation_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in [UserRole.GESTOR_AMVALI]:
        raise HTTPException(status_code=403, detail="Only AMVALI managers can allocate team")
    
    project_id = allocation_data.get('project_id')
    team_ids = allocation_data.get('team_ids', [])
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"assigned_team": team_ids, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Update team member active projects count
    for tid in team_ids:
        count = await db.projects.count_documents({
            "assigned_team": tid,
            "status": {"$nin": [ProjectStatus.CONCLUIDO]}
        })
        await db.users.update_one({"id": tid}, {"$set": {"active_projects": count}})
    
    return {"message": "Team allocated"}

# ==================== DASHBOARD ROUTES ====================
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    # Total projects
    total_projects = await db.projects.count_documents({})
    active_projects = await db.projects.count_documents({"status": {"$nin": [ProjectStatus.CONCLUIDO, ProjectStatus.RASCUNHO]}})
    completed_projects = await db.projects.count_documents({"status": ProjectStatus.CONCLUIDO})
    
    # Projects by status
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_counts = await db.projects.aggregate(pipeline).to_list(20)
    
    # Projects by type
    type_pipeline = [
        {"$group": {"_id": "$project_type", "count": {"$sum": 1}}}
    ]
    type_counts = await db.projects.aggregate(type_pipeline).to_list(10)
    
    # Team capacity
    team = await db.users.find({"role": UserRole.TECNICO_AMVALI}, {"_id": 0}).to_list(100)
    total_capacity = sum(t.get('workload_hours', 40) for t in team)
    used_capacity = sum(t.get('active_projects', 0) * 8 for t in team)
    capacity_percent = (used_capacity / max(total_capacity, 1)) * 100
    
    # Municipalities count
    municipalities_count = await db.municipalities.count_documents({})
    
    # Overdue projects (simplified - projects in execution for > 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    overdue = await db.projects.count_documents({
        "status": ProjectStatus.EXECUCAO,
        "created_at": {"$lt": thirty_days_ago}
    })
    
    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "completed_projects": completed_projects,
        "projects_by_status": {s['_id']: s['count'] for s in status_counts},
        "projects_by_type": {t['_id']: t['count'] for t in type_counts},
        "team_capacity_percent": round(capacity_percent, 1),
        "municipalities_count": municipalities_count,
        "overdue_projects": overdue,
        "queue_size": await db.projects.count_documents({"status": {"$in": [ProjectStatus.VALIDACAO, ProjectStatus.EXECUCAO]}})
    }

@api_router.get("/dashboard/municipality/{municipality_id}")
async def get_municipality_dashboard(municipality_id: str, current_user: dict = Depends(get_current_user)):
    municipality = await db.municipalities.find_one({"id": municipality_id}, {"_id": 0})
    if not municipality:
        raise HTTPException(status_code=404, detail="Municipality not found")
    
    projects = await db.projects.find({"municipality_id": municipality_id}, {"_id": 0}).to_list(100)
    
    active = [p for p in projects if p['status'] not in [ProjectStatus.CONCLUIDO, ProjectStatus.RASCUNHO]]
    completed = [p for p in projects if p['status'] == ProjectStatus.CONCLUIDO]
    
    return {
        "municipality": municipality,
        "total_projects": len(projects),
        "active_projects": len(active),
        "completed_projects": len(completed),
        "projects": projects,
        "engagement_score": municipality.get('engagement_score', 0),
        "active_stars": municipality.get('active_stars', {})
    }

# ==================== NOTIFICATION ROUTES ====================
@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user['id']}
    if current_user['role'] == UserRole.MUNICIPAL:
        query = {"$or": [
            {"user_id": current_user['id']},
            {"user_id": current_user.get('municipality_id', '')}
        ]}
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"id": notification_id}, {"$set": {"read": True}})
    return {"message": "Notification marked as read"}

# ==================== AI ROUTES ====================
@api_router.post("/ai/diagnose-complexity")
async def diagnose_complexity(project_data: dict, current_user: dict = Depends(get_current_user)):
    """Use Claude AI to diagnose project complexity"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"complexity": "media", "diagnosis": "AI não disponível - classificação padrão", "confidence": 0.5}
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"diagnosis-{project_data.get('project_id', 'new')}",
            system_message="""Você é um especialista em análise de projetos de engenharia e infraestrutura para a AMVALI.
            Analise os dados do projeto e classifique sua complexidade em: 'minima', 'media' ou 'alta'.
            Considere: escopo, localização, tipo de projeto, finalidade, impacto regional.
            Responda em JSON: {"complexity": "minima|media|alta", "justification": "...", "confidence": 0.0-1.0, "recommendations": [...]}"""
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        message = UserMessage(
            text=f"""Analise este projeto:
            - Título: {project_data.get('title', 'N/A')}
            - Tipo: {project_data.get('project_type', 'N/A')}
            - Descrição: {project_data.get('description', 'N/A')}
            - Localização: {project_data.get('location', 'N/A')}
            - Escopo: {project_data.get('scope', 'N/A')}
            - Finalidade: {project_data.get('purpose', 'N/A')}
            - Impacto (1-10): {project_data.get('impact_score', 5)}
            - Urgência (1-10): {project_data.get('urgency_score', 5)}
            """
        )
        
        response = await chat.send_message(message)
        
        import json
        try:
            result = json.loads(response)
        except:
            result = {"complexity": "media", "justification": response, "confidence": 0.7, "recommendations": []}
        
        # Update project if ID provided
        if project_data.get('project_id'):
            ipr = calculate_ipr(
                project_data.get('impact_score', 1),
                project_data.get('urgency_score', 1),
                project_data.get('cost_score', 1),
                result.get('complexity', 'media')
            )
            await db.projects.update_one(
                {"id": project_data['project_id']},
                {"$set": {
                    "complexity": result.get('complexity', 'media'),
                    "ai_diagnosis": result.get('justification', ''),
                    "ipr_score": ipr,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return result
        
    except Exception as e:
        logger.error(f"AI diagnosis error: {e}")
        return {"complexity": "media", "diagnosis": str(e), "confidence": 0.5}

@api_router.post("/ai/suggest-allocation")
async def suggest_allocation(project_data: dict, current_user: dict = Depends(get_current_user)):
    """Use Claude AI to suggest team allocation"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"suggestions": [], "message": "AI não disponível"}
        
        # Get available team
        team = await db.users.find({"role": UserRole.TECNICO_AMVALI}, {"_id": 0, "password_hash": 0}).to_list(50)
        
        team_info = []
        for t in team:
            active = await db.projects.count_documents({
                "assigned_team": t['id'],
                "status": {"$nin": [ProjectStatus.CONCLUIDO]}
            })
            team_info.append({
                "id": t['id'],
                "name": t['name'],
                "specialties": t.get('specialties', []),
                "active_projects": active,
                "capacity": t.get('workload_hours', 40)
            })
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"allocation-{project_data.get('project_id', 'new')}",
            system_message="""Você é um especialista em gestão de equipes técnicas da AMVALI.
            Sugira a melhor alocação de equipe considerando especialidades, carga de trabalho e complexidade do projeto.
            Responda em JSON: {"suggested_team": ["id1", "id2"], "reasoning": "...", "workload_impact": "..."}"""
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        message = UserMessage(
            text=f"""Projeto:
            - Título: {project_data.get('title', 'N/A')}
            - Tipo: {project_data.get('project_type', 'N/A')}
            - Complexidade: {project_data.get('complexity', 'media')}
            - Prioridade: {project_data.get('priority', 3)} estrelas
            
            Equipe disponível:
            {json.dumps(team_info, indent=2, ensure_ascii=False)}
            """
        )
        
        import json
        response = await chat.send_message(message)
        
        try:
            result = json.loads(response)
        except:
            result = {"suggested_team": [], "reasoning": response, "workload_impact": "N/A"}
        
        return result
        
    except Exception as e:
        logger.error(f"AI allocation error: {e}")
        return {"suggestions": [], "message": str(e)}

# ==================== SEED DATA ====================
@api_router.post("/seed")
async def seed_data():
    """Seed initial data for testing"""
    # Clear existing data
    await db.users.delete_many({})
    await db.municipalities.delete_many({})
    await db.projects.delete_many({})
    await db.notifications.delete_many({})
    
    # Create municipalities
    municipalities_data = [
        {"name": "Jaraguá do Sul", "code": "JS", "contact_email": "contato@jaragua.sc.gov.br"},
        {"name": "Guaramirim", "code": "GR", "contact_email": "contato@guaramirim.sc.gov.br"},
        {"name": "Schroeder", "code": "SC", "contact_email": "contato@schroeder.sc.gov.br"},
        {"name": "Corupá", "code": "CR", "contact_email": "contato@corupa.sc.gov.br"},
        {"name": "Massaranduba", "code": "MS", "contact_email": "contato@massaranduba.sc.gov.br"},
    ]
    
    municipalities = []
    for m_data in municipalities_data:
        m = Municipality(**m_data, engagement_score=round(50 + (hash(m_data['name']) % 50), 1))
        doc = m.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.municipalities.insert_one(doc)
        municipalities.append(m)
    
    # Create users
    users_data = [
        {"email": "admin@amvali.org.br", "name": "Administrador AMVALI", "role": UserRole.GESTOR_AMVALI, "password": "admin123"},
        {"email": "tecnico1@amvali.org.br", "name": "Carlos Silva - Arquiteto", "role": UserRole.TECNICO_AMVALI, "password": "tecnico123", "specialties": ["edificacao", "pavimentacao"]},
        {"email": "tecnico2@amvali.org.br", "name": "Ana Santos - Engenheira Civil", "role": UserRole.TECNICO_AMVALI, "password": "tecnico123", "specialties": ["infraestrutura", "pavimentacao"]},
        {"email": "tecnico3@amvali.org.br", "name": "Pedro Costa - Projetista", "role": UserRole.TECNICO_AMVALI, "password": "tecnico123", "specialties": ["edificacao"]},
        {"email": "municipal@jaragua.sc.gov.br", "name": "João Prefeito", "role": UserRole.MUNICIPAL, "password": "municipal123", "municipality_id": municipalities[0].id},
        {"email": "municipal@guaramirim.sc.gov.br", "name": "Maria Secretária", "role": UserRole.MUNICIPAL, "password": "municipal123", "municipality_id": municipalities[1].id},
    ]
    
    for u_data in users_data:
        password = u_data.pop('password')
        specialties = u_data.pop('specialties', [])
        user = User(**u_data, specialties=specialties)
        doc = user.model_dump()
        doc['password_hash'] = hash_password(password)
        doc['created_at'] = doc['created_at'].isoformat()
        await db.users.insert_one(doc)
    
    # Create sample projects
    projects_data = [
        {
            "title": "Pavimentação Rua das Flores",
            "description": "Pavimentação asfáltica da Rua das Flores, trecho de 500m",
            "project_type": ProjectType.PAVIMENTACAO,
            "municipality_id": municipalities[0].id,
            "priority": 4,
            "status": ProjectStatus.EXECUCAO,
            "progress_percent": 65,
            "complexity": Complexity.MEDIA,
            "impact_score": 7,
            "urgency_score": 6,
            "cost_score": 5
        },
        {
            "title": "Construção Creche Municipal",
            "description": "Projeto executivo para construção de creche com capacidade para 120 crianças",
            "project_type": ProjectType.EDIFICACAO,
            "municipality_id": municipalities[1].id,
            "priority": 5,
            "status": ProjectStatus.VALIDACAO,
            "progress_percent": 45,
            "complexity": Complexity.ALTA,
            "impact_score": 9,
            "urgency_score": 8,
            "cost_score": 8
        },
        {
            "title": "Rede de Drenagem Bairro Centro",
            "description": "Sistema de drenagem pluvial para o bairro Centro",
            "project_type": ProjectType.INFRAESTRUTURA,
            "municipality_id": municipalities[2].id,
            "priority": 3,
            "status": ProjectStatus.BRIEFING,
            "progress_percent": 20,
            "complexity": Complexity.MEDIA,
            "impact_score": 6,
            "urgency_score": 5,
            "cost_score": 6
        },
        {
            "title": "Reforma Praça Central",
            "description": "Revitalização completa da Praça Central com paisagismo",
            "project_type": ProjectType.EDIFICACAO,
            "municipality_id": municipalities[0].id,
            "priority": 2,
            "status": ProjectStatus.DIAGNOSTICO,
            "progress_percent": 30,
            "complexity": Complexity.MINIMA,
            "impact_score": 5,
            "urgency_score": 3,
            "cost_score": 4
        },
        {
            "title": "Ponte sobre Rio Itapocu",
            "description": "Projeto estrutural para ponte de 80m sobre o Rio Itapocu",
            "project_type": ProjectType.INFRAESTRUTURA,
            "municipality_id": municipalities[3].id,
            "priority": 5,
            "status": ProjectStatus.SOLICITACAO,
            "progress_percent": 10,
            "complexity": Complexity.ALTA,
            "impact_score": 10,
            "urgency_score": 7,
            "cost_score": 9
        },
    ]
    
    default_stages = [
        {"name": "Solicitação Formal", "status": "pending"},
        {"name": "Briefing Técnico", "status": "pending"},
        {"name": "Diagnóstico de Complexidade", "status": "pending"},
        {"name": "Validação Conjunta", "status": "pending"},
        {"name": "Execução", "status": "pending"},
        {"name": "Entrega e Encerramento", "status": "pending"}
    ]
    
    for p_data in projects_data:
        municipality = next((m for m in municipalities if m.id == p_data['municipality_id']), None)
        stages = default_stages.copy()
        
        # Set stages based on status
        status_index = {
            ProjectStatus.SOLICITACAO: 0,
            ProjectStatus.BRIEFING: 1,
            ProjectStatus.DIAGNOSTICO: 2,
            ProjectStatus.VALIDACAO: 3,
            ProjectStatus.EXECUCAO: 4,
            ProjectStatus.ENTREGA: 5
        }.get(p_data['status'], 0)
        
        for i in range(status_index):
            stages[i]['status'] = 'completed'
        if status_index < len(stages):
            stages[status_index]['status'] = 'in_progress'
        
        ipr = calculate_ipr(p_data['impact_score'], p_data['urgency_score'], p_data['cost_score'], p_data['complexity'])
        
        project = Project(
            title=p_data['title'],
            description=p_data['description'],
            project_type=p_data['project_type'],
            municipality_id=p_data['municipality_id'],
            municipality_name=municipality.name if municipality else "Unknown",
            priority=p_data['priority'],
            status=p_data['status'],
            progress_percent=p_data['progress_percent'],
            complexity=p_data['complexity'],
            impact_score=p_data['impact_score'],
            urgency_score=p_data['urgency_score'],
            cost_score=p_data['cost_score'],
            ipr_score=ipr,
            stages=stages
        )
        
        doc = project.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.projects.insert_one(doc)
    
    return {"message": "Seed data created successfully", "municipalities": len(municipalities), "projects": len(projects_data)}

# ==================== ROOT ====================
@api_router.get("/")
async def root():
    return {"message": "Portal IntraAMVALI API", "version": "1.0.0"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
