import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Loader2,
  TrendingUp,
  Star,
  FolderKanban,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { useAuth } from '../contexts/AuthContext';
import { getMunicipalities } from '../services/api';

const MunicipalitiesPage = () => {
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMunicipalities();
  }, []);

  const loadMunicipalities = async () => {
    try {
      const response = await getMunicipalities();
      setMunicipalities(response.data);
    } catch (error) {
      console.error('Failed to load municipalities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEngagementColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="municipalities-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Municípios</h1>
        <p className="text-slate-500 mt-1">
          {municipalities.length} município(s) cadastrado(s)
        </p>
      </div>

      {/* Municipalities Grid */}
      {municipalities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {municipalities.map((municipality) => {
            const totalStars = Object.values(municipality.active_stars || {}).reduce((a, b) => a + b, 0);
            
            return (
              <Card 
                key={municipality.id} 
                className="hover:shadow-md transition-shadow"
                data-testid={`municipality-${municipality.id}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">{municipality.name}</h3>
                      <p className="text-sm text-slate-500">{municipality.code}</p>
                    </div>
                    <Badge 
                      variant={municipality.financial_regularity ? 'outline' : 'destructive'}
                      className="flex-shrink-0"
                    >
                      {municipality.financial_regularity ? 'Regular' : 'Irregular'}
                    </Badge>
                  </div>

                  {/* Engagement Score */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Engajamento
                      </span>
                      <span className={`font-bold ${getEngagementColor(municipality.engagement_score || 0)}`}>
                        {(municipality.engagement_score || 0).toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={municipality.engagement_score || 0} 
                      className="h-2"
                    />
                  </div>

                  {/* Stats Grid */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <FolderKanban className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                      <p className="text-lg font-bold text-slate-900">
                        {municipality.total_projects || 0}
                      </p>
                      <p className="text-[10px] text-slate-500">Projetos</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <CheckCircle2 className="w-4 h-4 mx-auto text-green-500 mb-1" />
                      <p className="text-lg font-bold text-green-700">
                        {municipality.completed_projects || 0}
                      </p>
                      <p className="text-[10px] text-slate-500">Concluídos</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <Star className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                      <p className="text-lg font-bold text-amber-700">
                        {totalStars}
                      </p>
                      <p className="text-[10px] text-slate-500">Estrelas Ativas</p>
                    </div>
                  </div>

                  {/* Active Stars by Area */}
                  {Object.keys(municipality.active_stars || {}).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-400 mb-2">Estrelas por Área</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(municipality.active_stars).map(([area, stars]) => (
                          <Badge key={area} variant="outline" className="text-xs">
                            {area}: {stars}/5 ★
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-1">Contato</p>
                    <p className="text-sm text-slate-600 truncate">
                      {municipality.contact_email}
                    </p>
                  </div>

                  {/* Meeting Participations */}
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5" />
                    <span>{municipality.meeting_participations || 0} participações em reuniões</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              Nenhum município cadastrado
            </h3>
            <p className="text-slate-500">
              Não há municípios no sistema ainda
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MunicipalitiesPage;
