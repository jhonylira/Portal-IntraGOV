import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Building2,
  Users,
  TrendingUp,
  ListOrdered,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import MetricCard from '../components/custom/MetricCard';
import ProjectCard from '../components/custom/ProjectCard';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats, getProjects, getMunicipalityDashboard } from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0d9488', '#0f172a', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

const statusLabels = {
  solicitacao: 'Solicitação',
  briefing: 'Briefing',
  diagnostico: 'Diagnóstico',
  validacao: 'Validação',
  execucao: 'Execução',
  entrega: 'Entrega',
  concluido: 'Concluído',
  pausado: 'Pausado'
};

const DashboardPage = () => {
  const { user, isMunicipal } = useAuth();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      if (isMunicipal && user?.municipality_id) {
        const response = await getMunicipalityDashboard(user.municipality_id);
        setStats({
          total_projects: response.data.total_projects,
          active_projects: response.data.active_projects,
          completed_projects: response.data.completed_projects,
          projects_by_status: {},
          projects_by_type: {},
          team_capacity_percent: 0,
          municipalities_count: 1,
          overdue_projects: 0,
          queue_size: 0,
          engagement_score: response.data.engagement_score
        });
        setProjects(response.data.projects || []);
      } else {
        const [statsRes, projectsRes] = await Promise.all([
          getDashboardStats(),
          getProjects()
        ]);
        setStats(statsRes.data);
        setProjects(projectsRes.data.slice(0, 6));
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const statusChartData = Object.entries(stats?.projects_by_status || {}).map(([key, value]) => ({
    name: statusLabels[key] || key,
    value
  }));

  const typeChartData = Object.entries(stats?.projects_by_type || {}).map(([key, value]) => ({
    name: key === 'pavimentacao' ? 'Pavimentação' : key === 'edificacao' ? 'Edificação' : 'Infraestrutura',
    value
  }));

  return (
    <div className="space-y-8 fade-in" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          {isMunicipal 
            ? 'Acompanhe os projetos do seu município'
            : 'Visão geral dos projetos e indicadores'}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Projetos"
          value={stats?.total_projects || 0}
          icon={FolderKanban}
          variant="default"
        />
        <MetricCard
          title="Projetos Ativos"
          value={stats?.active_projects || 0}
          icon={Clock}
          variant="primary"
          subtitle="Em andamento"
        />
        <MetricCard
          title="Concluídos"
          value={stats?.completed_projects || 0}
          icon={CheckCircle2}
          variant="success"
        />
        {!isMunicipal ? (
          <MetricCard
            title="Na Fila"
            value={stats?.queue_size || 0}
            icon={ListOrdered}
            variant="warning"
            subtitle="Aguardando execução"
          />
        ) : (
          <MetricCard
            title="Engajamento"
            value={`${stats?.engagement_score?.toFixed(0) || 0}%`}
            icon={TrendingUp}
            variant="primary"
          />
        )}
      </div>

      {/* Secondary Metrics (Admin only) */}
      {!isMunicipal && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Municípios"
            value={stats?.municipalities_count || 0}
            icon={Building2}
          />
          <MetricCard
            title="Capacidade da Equipe"
            value={`${stats?.team_capacity_percent?.toFixed(0) || 0}%`}
            icon={Users}
            variant={stats?.team_capacity_percent > 85 ? 'danger' : 'default'}
            subtitle={stats?.team_capacity_percent > 85 ? 'Atenção: Alta ocupação' : 'Utilização atual'}
          />
          <MetricCard
            title="Projetos em Atraso"
            value={stats?.overdue_projects || 0}
            icon={AlertTriangle}
            variant={stats?.overdue_projects > 0 ? 'danger' : 'success'}
          />
        </div>
      )}

      {/* Charts */}
      {!isMunicipal && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Projetos por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-400">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>

          {/* Type Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Projetos por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              {typeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={typeChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {typeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-400">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Capacity Bar (Admin only) */}
      {!isMunicipal && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capacidade da Equipe Técnica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Utilização atual</span>
                <span className="font-medium">{stats?.team_capacity_percent?.toFixed(1) || 0}%</span>
              </div>
              <Progress 
                value={stats?.team_capacity_percent || 0} 
                className="h-3"
              />
              <p className="text-xs text-slate-400">
                {stats?.team_capacity_percent > 85 
                  ? 'A equipe está próxima da capacidade máxima. Considere repriorizar projetos.'
                  : 'Capacidade saudável para novos projetos.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            {isMunicipal ? 'Seus Projetos' : 'Projetos Recentes'}
          </h2>
        </div>
        
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                showMunicipality={!isMunicipal}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhum projeto encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
