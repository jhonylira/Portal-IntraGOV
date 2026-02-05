#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class IntraAMVALITester:
    def __init__(self, base_url="https://projeto-gestao-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.tokens = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                
                self.failed_tests.append({
                    "test": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "error": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": str(e)
            })
            return False, {}

    def test_login(self, email, password, role_name):
        """Test login and get token"""
        success, response = self.run_test(
            f"Login {role_name}",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'token' in response:
            self.tokens[role_name] = response['token']
            print(f"   Token stored for {role_name}")
            return True, response['user']
        return False, {}

    def test_dashboard_stats(self, token):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200,
            token=token
        )
        return success, response

    def test_projects_list(self, token):
        """Test projects list endpoint"""
        success, response = self.run_test(
            "Projects List",
            "GET",
            "projects",
            200,
            token=token
        )
        return success, response

    def test_queue(self, token):
        """Test technical queue endpoint"""
        success, response = self.run_test(
            "Technical Queue",
            "GET",
            "queue",
            200,
            token=token
        )
        return success, response

    def test_team(self, token):
        """Test team endpoint"""
        success, response = self.run_test(
            "Team Management",
            "GET",
            "team",
            200,
            token=token
        )
        return success, response

    def test_municipalities(self, token):
        """Test municipalities endpoint"""
        success, response = self.run_test(
            "Municipalities List",
            "GET",
            "municipalities",
            200,
            token=token
        )
        return success, response

    def test_create_project(self, token, municipality_id):
        """Test project creation with Municipal Module features"""
        project_data = {
            "title": "Teste Módulo Municipal",
            "description": "Projeto de teste para o novo módulo municipal com IA orientativa",
            "project_type": "pavimentacao",
            "municipality_id": municipality_id,
            "priority": 4,
            "location": "Centro da cidade",
            "scope": "Pavimentação de 200m com drenagem",
            "purpose": "Melhorar mobilidade urbana e acessibilidade",
            "impact_score": 7,
            "urgency_score": 6,
            "cost_score": 5,
            "desired_deadline": "medio"  # New field for Municipal Module
        }
        
        success, response = self.run_test(
            "Create Project (Municipal Module)",
            "POST",
            "projects",
            201,
            data=project_data,
            token=token
        )
        return success, response

    def test_ai_diagnosis(self, token, project_data):
        """Test AI diagnosis endpoint"""
        success, response = self.run_test(
            "AI Diagnosis",
            "POST",
            "ai/diagnose-complexity",
            200,
            data=project_data,
            token=token
        )
        return success, response

    def test_municipal_ai_analysis(self, token):
        """Test Municipal AI Analysis endpoint - the new orientative AI feature"""
        analysis_data = {
            "title": "Pavimentação Rua Municipal",
            "description": "Projeto de pavimentação asfáltica de 300m",
            "project_type": "pavimentacao",
            "location": "Bairro Centro",
            "scope": "Pavimentação completa com drenagem",
            "purpose": "Melhorar mobilidade urbana",
            "impact_score": 7,
            "urgency_score": 6,
            "desired_deadline": "medio",
            "attachments": [
                {"filename": "topografico.pdf", "file_type": "pdf", "file_size": 1024000},
                {"filename": "matricula.pdf", "file_type": "pdf", "file_size": 512000}
            ]
        }
        
        success, response = self.run_test(
            "Municipal AI Analysis (Orientative)",
            "POST",
            "ai/municipal-analysis",
            200,
            data=analysis_data,
            token=token
        )
        
        # Validate response structure for orientative AI
        if success and response:
            required_fields = [
                'information_sufficiency', 'missing_documents', 'estimated_complexity',
                'deadline_compatibility', 'suggested_deadline_days', 'technical_explanation',
                'disclaimer'
            ]
            for field in required_fields:
                if field not in response:
                    print(f"   ⚠️ Missing required field: {field}")
                    return False, response
            
            # Check disclaimer is present (mandatory for orientative AI)
            if 'orientativ' not in response.get('disclaimer', '').lower():
                print(f"   ⚠️ Disclaimer missing 'orientativo' keyword")
                return False, response
            
            print(f"   ✅ AI Analysis: {response.get('information_sufficiency', 'N/A')}")
            print(f"   ✅ Complexity: {response.get('estimated_complexity', 'N/A')}")
            print(f"   ✅ Suggested deadline: {response.get('suggested_deadline_days', 'N/A')} days")
            print(f"   ✅ Disclaimer present: {len(response.get('disclaimer', ''))} chars")
        
        return success, response

    def test_project_attachments(self, token, project_id):
        """Test project attachments functionality"""
        # Test adding attachment
        attachment_data = {
            "filename": "projeto_executivo.pdf",
            "file_type": "pdf",
            "file_size": 2048000,
            "file_url": "https://example.com/file.pdf"
        }
        
        success, response = self.run_test(
            "Add Project Attachment",
            "POST",
            f"projects/{project_id}/attachments",
            200,
            data=attachment_data,
            token=token
        )
        
        if success:
            # Test getting attachments
            success2, attachments = self.run_test(
                "Get Project Attachments",
                "GET",
                f"projects/{project_id}/attachments",
                200,
                token=token
            )
            return success2, attachments
        
        return success, response

def main():
    print("🚀 Starting IntraAMVALI API Tests")
    print("=" * 50)
    
    tester = IntraAMVALITester()
    
    # Test credentials from the review request
    credentials = [
        {"email": "admin@amvali.org.br", "password": "admin123", "role": "gestor"},
        {"email": "tecnico1@amvali.org.br", "password": "tecnico123", "role": "tecnico"},
        {"email": "municipal@jaragua.sc.gov.br", "password": "municipal123", "role": "municipal"}
    ]
    
    # First, seed data
    print("\n📊 Seeding test data...")
    success, _ = tester.run_test("Seed Data", "POST", "seed", 200)
    if not success:
        print("❌ Failed to seed data, continuing with existing data...")
    
    # Test authentication for all user types
    users = {}
    for cred in credentials:
        success, user_data = tester.test_login(cred["email"], cred["password"], cred["role"])
        if success:
            users[cred["role"]] = user_data
        else:
            print(f"❌ Login failed for {cred['role']}")
            return 1
    
    # Test with Gestor AMVALI token (has access to everything)
    gestor_token = tester.tokens.get("gestor")
    if gestor_token:
        print("\n🔧 Testing with Gestor AMVALI permissions...")
        
        # Dashboard stats
        tester.test_dashboard_stats(gestor_token)
        
        # Projects list
        success, projects = tester.test_projects_list(gestor_token)
        
        # Queue
        tester.test_queue(gestor_token)
        
        # Team
        tester.test_team(gestor_token)
        
        # Municipalities
        success, municipalities = tester.test_municipalities(gestor_token)
        
        # Create a test project if we have municipalities
        if success and municipalities:
            municipality_id = municipalities[0]['id']
            success, project = tester.test_create_project(gestor_token, municipality_id)
            
            # Test AI diagnosis if project created
            if success:
                ai_data = {
                    "project_id": project['id'],
                    "title": project['title'],
                    "description": project['description'],
                    "project_type": project['project_type'],
                    "impact_score": project['impact_score'],
                    "urgency_score": project['urgency_score'],
                    "cost_score": project['cost_score']
                }
                tester.test_ai_diagnosis(gestor_token, ai_data)
    
    # Test with Técnico token
    tecnico_token = tester.tokens.get("tecnico")
    if tecnico_token:
        print("\n🔧 Testing with Técnico permissions...")
        tester.test_dashboard_stats(tecnico_token)
        tester.test_projects_list(tecnico_token)
        tester.test_queue(tecnico_token)
    
    # Test with Municipal token
    municipal_token = tester.tokens.get("municipal")
    if municipal_token:
        print("\n🏛️ Testing with Municipal permissions...")
        tester.test_dashboard_stats(municipal_token)
        tester.test_projects_list(municipal_token)
        
        # Municipal users should NOT have access to team endpoint
        success, _ = tester.run_test(
            "Team Access (Should Fail)",
            "GET",
            "team",
            403,  # Expecting forbidden
            token=municipal_token
        )
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for test in tester.failed_tests:
            print(f"   - {test['test']}: {test.get('error', 'Status mismatch')}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())