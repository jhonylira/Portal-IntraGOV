import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Users, 
  Clock,
  FileText,
  Sparkles,
  Edit,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import StarRating from '../components/custom/StarRating';
import RoadmapTimeline from '../components/custom/RoadmapTimeline';
import { useAuth } from '../contexts/AuthContext';
import { getProject, updateProject, updateProjectStage, diagnoseComplexity, getTeam, allocateTeam } from '../services/api';
import { toast } from 'sonner';

const statusLabels = {
  rascunho: 'Rascunho',
  solicitacao: 'Solicitação',
  briefing: 'Briefing',
  diagnostico: 'Diagnóstico',
  validacao: 'Validação',
  execucao: 'Execução',
  entrega: 'Entrega',
  concluido: 'Concluído',
  pausado: 'Pausado'
};

const typeLabels = {
  pavimentacao: 'Pavimentação',
  edificacao: 'Edificação',
  infraestrutura: 'Infraestrutura'
};

const complexityLabels = {
  minima: 'Mínima',
  media: 'Média',
  alta: 'Alta'
};

const statusColors = {
  rascunho: 'bg-gray-100 text-gray-700',
  solicitacao: 'bg-blue-100 text-blue-700',
  briefing: 'bg-purple-100 text-purple-700',
  diagnostico: 'bg-indigo-100 text-indigo-700',
  validacao: 'bg-yellow-100 text-yellow-700',
  execucao: 'bg-teal-100 text-teal-700',
  entrega: 'bg-emerald-100 text-emerald-700',
  concluido: 'bg-green-100 text-green-700',
  pausado: 'bg-gray-100 text-gray-700'
};

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isGestor, isTecnico } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [diagnosing, setDiagnosing] = useState(false);
  const [stageDialog, setStageDialog] = useState({ open: false, index: null, stage: null });
  const [teamDialog, setTeamDialog] = useState(false);
  const [team, setTeam] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState([]);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await getProject(id);
      setProject(response.data);
      setSelectedTeam(response.data.assigned_team || []);
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Erro ao carregar projeto');
    } finally {
      setLoading(false);
    }
  };

  const handleDiagnose = async () => {
    setDiagnosing(true);
    try {
      const response = await diagnoseComplexity({
        project_id: project.id,
        title: project.title,
        description: project.description,
        project_type: project.project_type,
        location: project.location,
        scope: project.scope,
        purpose: project.purpose,
        impact_score: project.impact_score,
        urgency_score: project.urgency_score,
        cost_score: project.cost_score
      });
      
      toast.success(`Complexidade diagnosticada: ${complexityLabels[response.data.complexity] || response.data.complexity}`);
      loadProject();
    } catch (error) {
      console.error('Failed to diagnose:', error);
      toast.error('Erro no diagnóstico de IA');
    } finally {
      setDiagnosing(false);
    }
  };

  const handleStageUpdate = async (newStatus) => {
    try {
      await updateProjectStage(project.id, {
        stage_index: stageDialog.index,
        status: newStatus
      });
      toast.success('Etapa atualizada com sucesso');
      setStageDialog({ open: false, index: null, stage: null });
      loadProject();
    } catch (error) {
      console.error('Failed to update stage:', error);
      toast.error('Erro ao atualizar etapa');
    }
  };

  const handleOpenTeamDialog = async () => {
    try {
      const response = await getTeam();
      setTeam(response.data.team || []);
      setTeamDialog(true);
    } catch (error) {
      console.error('Failed to load team:', error);
      toast.error('Erro ao carregar equipe');
    }
  };

  const handleAllocateTeam = async () => {
    try {
      await allocateTeam({
        project_id: project.id,
        team_ids: selectedTeam
      });
      toast.success('Equipe alocada com sucesso');
      setTeamDialog(false);
      loadProject();
    } catch (error) {
      console.error('Failed to allocate team:', error);
      toast.error('Erro ao alocar equipe');
    }
  };

  const toggleTeamMember = (memberId) => {
    setSelectedTeam(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Projeto não encontrado</p>
        <Link to="/projects">
          <Button variant="outline" className="mt-4">Voltar para projetos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="project-detail-page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/projects')}
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
              <Badge className={statusColors[project.status]}>
                {statusLabels[project.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {project.municipality_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(project.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
        
        {(isGestor || isTecnico) && (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleDiagnose}
              disabled={diagnosing}
              data-testid="diagnose-button"
            >
              {diagnosing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Diagnóstico IA
            </Button>
            {isGestor && (
              <Button 
                variant="outline"
                onClick={handleOpenTeamDialog}
                data-testid="allocate-team-button"
              >
                <Users className="w-4 h-4 mr-2" />
                Alocar Equipe
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Roadmap do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <RoadmapTimeline 
            stages={project.stages || []}
            onStageClick={(index, stage) => {
              if (isGestor || isTecnico) {
                setStageDialog({ open: true, index, stage });
              }
            }}
            readonly={!isGestor && !isTecnico}
          />
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">{project.description || 'Sem descrição'}</p>
              
              {(project.location || project.scope || project.purpose) && (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {project.location && (
                      <div>
                        <p className="text-sm font-medium text-slate-500">Localização</p>
                        <p className="text-slate-700">{project.location}</p>
                      </div>
                    )}
                    {project.scope && (
                      <div>
                        <p className="text-sm font-medium text-slate-500">Escopo</p>
                        <p className="text-slate-700">{project.scope}</p>
                      </div>
                    )}
                    {project.purpose && (
                      <div>
                        <p className="text-sm font-medium text-slate-500">Finalidade</p>
                        <p className="text-slate-700">{project.purpose}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* AI Diagnosis */}
          {project.ai_diagnosis && (
            <Card className="border-teal-200 bg-teal-50/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  Diagnóstico de IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">{project.ai_diagnosis}</p>
              </CardContent>
            </Card>
          )}

          {/* Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Critérios de Avaliação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-2">Impacto Regional</p>
                  <div className="flex items-center gap-2">
                    <Progress value={project.impact_score * 10} className="flex-1" />
                    <span className="font-medium">{project.impact_score}/10</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-2">Urgência</p>
                  <div className="flex items-center gap-2">
                    <Progress value={project.urgency_score * 10} className="flex-1" />
                    <span className="font-medium">{project.urgency_score}/10</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-2">Custo/Investimento</p>
                  <div className="flex items-center gap-2">
                    <Progress value={project.cost_score * 10} className="flex-1" />
                    <span className="font-medium">{project.cost_score}/10</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Prioridade</p>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating value={project.priority} readonly size="md" showLabel />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-slate-500">Tipo de Projeto</p>
                <p className="text-slate-700 mt-1">{typeLabels[project.project_type]}</p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-slate-500">Complexidade</p>
                <p className="text-slate-700 mt-1">
                  {project.complexity ? complexityLabels[project.complexity] : 'Não avaliada'}
                </p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-slate-500">IPR Score</p>
                <p className="text-2xl font-bold text-teal-600 mt-1">
                  {project.ipr_score?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-slate-500">Progresso</p>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{project.progress_percent?.toFixed(0) || 0}% concluído</span>
                  </div>
                  <Progress value={project.progress_percent || 0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Equipe Alocada
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.assigned_team?.length > 0 ? (
                <div className="space-y-2">
                  {project.assigned_team.map((memberId, index) => (
                    <div key={memberId} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-teal-700">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm text-slate-600">Técnico {index + 1}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Nenhum técnico alocado</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stage Update Dialog */}
      <Dialog open={stageDialog.open} onOpenChange={(open) => !open && setStageDialog({ open: false, index: null, stage: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Etapa</DialogTitle>
            <DialogDescription>
              {stageDialog.stage?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-500 mb-4">
              Status atual: <Badge>{stageDialog.stage?.status}</Badge>
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleStageUpdate('pending')}
                className="flex-1"
              >
                <Clock className="w-4 h-4 mr-2" />
                Pendente
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleStageUpdate('in_progress')}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                Em Progresso
              </Button>
              <Button 
                onClick={() => handleStageUpdate('completed')}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Concluído
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Allocation Dialog */}
      <Dialog open={teamDialog} onOpenChange={setTeamDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Alocar Equipe Técnica</DialogTitle>
            <DialogDescription>
              Selecione os técnicos para este projeto
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[400px] overflow-y-auto">
            {team.length > 0 ? (
              <div className="space-y-2">
                {team.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => toggleTeamMember(member.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTeam.includes(member.id)
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.email}</p>
                        <div className="flex gap-1 mt-1">
                          {member.specialties?.map((spec) => (
                            <Badge key={spec} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">{member.active_projects} projetos</p>
                        <p className="text-xs text-slate-400">{member.capacity_percent?.toFixed(0)}% ocupado</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">Nenhum técnico disponível</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAllocateTeam} className="bg-teal-600 hover:bg-teal-700">
              Confirmar Alocação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectDetailPage;
