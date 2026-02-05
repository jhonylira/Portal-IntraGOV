import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Loader2,
  User,
  Briefcase,
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { useAuth } from '../contexts/AuthContext';
import { getTeam } from '../services/api';

const TeamPage = () => {
  const { isGestor } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const response = await getTeam();
      setTeam(response.data.team || []);
    } catch (error) {
      console.error('Failed to load team:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCapacityColor = (percent) => {
    if (percent >= 85) return 'text-red-600';
    if (percent >= 60) return 'text-amber-600';
    return 'text-green-600';
  };

  const getCapacityBg = (percent) => {
    if (percent >= 85) return 'bg-red-100';
    if (percent >= 60) return 'bg-amber-100';
    return 'bg-green-100';
  };

  const totalCapacity = team.reduce((sum, m) => sum + (m.workload_hours || 40), 0);
  const usedCapacity = team.reduce((sum, m) => sum + ((m.active_projects || 0) * 8), 0);
  const overallCapacity = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="team-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Equipe Técnica</h1>
        <p className="text-slate-500 mt-1">
          Gerencie a capacidade e alocação da equipe
        </p>
      </div>

      {/* Overall Capacity */}
      <Card className={overallCapacity >= 85 ? 'border-red-200 bg-red-50' : ''}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Capacidade Global da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-500">Utilização atual</span>
                <span className={`font-bold ${getCapacityColor(overallCapacity)}`}>
                  {overallCapacity.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(overallCapacity, 100)} 
                className="h-3"
              />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{team.length}</p>
              <p className="text-sm text-slate-500">técnicos</p>
            </div>
          </div>
          
          {overallCapacity >= 85 && (
            <div className="mt-4 flex items-center gap-2 text-red-700 bg-red-100 rounded-lg p-3">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">
                Atenção: A equipe está próxima da capacidade máxima (85%). 
                Considere repriorizar projetos ou pausar demandas.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Grid */}
      {team.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((member) => (
            <Card 
              key={member.id} 
              className="hover:shadow-md transition-shadow"
              data-testid={`team-member-${member.id}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-teal-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{member.name}</h3>
                    <p className="text-sm text-slate-500 truncate">{member.email}</p>
                  </div>
                </div>

                {/* Specialties */}
                <div className="mt-4">
                  <p className="text-xs text-slate-400 mb-2">Especialidades</p>
                  <div className="flex flex-wrap gap-1">
                    {member.specialties?.length > 0 ? (
                      member.specialties.map((spec) => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {spec === 'pavimentacao' && 'Pavimentação'}
                          {spec === 'edificacao' && 'Edificação'}
                          {spec === 'infraestrutura' && 'Infraestrutura'}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">Não definidas</span>
                    )}
                  </div>
                </div>

                {/* Capacity */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">Ocupação</span>
                    <span className={`text-sm font-bold ${getCapacityColor(member.capacity_percent || 0)}`}>
                      {(member.capacity_percent || 0).toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(member.capacity_percent || 0, 100)} 
                    className="h-2"
                  />
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className={`rounded-lg p-3 ${getCapacityBg(member.capacity_percent || 0)}`}>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-slate-600" />
                      <span className="text-lg font-bold">{member.active_projects || 0}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Projetos ativos</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-600" />
                      <span className="text-lg font-bold">{member.workload_hours || 40}h</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Carga semanal</p>
                  </div>
                </div>

                {/* Assigned Projects */}
                {member.assigned_projects?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-2">Projetos alocados</p>
                    <div className="space-y-1">
                      {member.assigned_projects.slice(0, 3).map((proj) => (
                        <div 
                          key={proj.id}
                          className="text-xs p-2 bg-slate-50 rounded flex items-center justify-between"
                        >
                          <span className="truncate flex-1">{proj.title}</span>
                          <Badge variant="outline" className="text-[10px] ml-2">
                            {proj.status}
                          </Badge>
                        </div>
                      ))}
                      {member.assigned_projects.length > 3 && (
                        <p className="text-xs text-slate-400 text-center">
                          +{member.assigned_projects.length - 3} mais
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              Nenhum técnico cadastrado
            </h3>
            <p className="text-slate-500">
              Não há técnicos na equipe AMVALI no momento
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamPage;
