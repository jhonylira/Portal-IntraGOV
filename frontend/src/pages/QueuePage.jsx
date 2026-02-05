import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ListOrdered, 
  Loader2,
  ArrowUpDown,
  Clock,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import StarRating from '../components/custom/StarRating';
import { useAuth } from '../contexts/AuthContext';
import { getQueue } from '../services/api';

const statusLabels = {
  validacao: 'Validação',
  execucao: 'Execução',
};

const typeLabels = {
  pavimentacao: 'Pavimentação',
  edificacao: 'Edificação',
  infraestrutura: 'Infraestrutura'
};

const complexityColors = {
  minima: 'bg-green-100 text-green-700',
  media: 'bg-yellow-100 text-yellow-700',
  alta: 'bg-red-100 text-red-700'
};

const QueuePage = () => {
  const { isGestor } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const response = await getQueue();
      setQueue(response.data.queue || []);
    } catch (error) {
      console.error('Failed to load queue:', error);
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

  return (
    <div className="space-y-6 fade-in" data-testid="queue-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fila Técnica</h1>
          <p className="text-slate-500 mt-1">
            {queue.length} projeto(s) na fila de execução
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-teal-50 border-teal-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <ArrowUpDown className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="font-medium text-teal-900">Ordenação Inteligente</h3>
              <p className="text-sm text-teal-700 mt-1">
                A fila é ordenada automaticamente pelo <strong>Índice de Prioridade Regional (IPR)</strong>, 
                que considera impacto, urgência, custo e complexidade. Projetos com maior IPR são priorizados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue List */}
      {queue.length > 0 ? (
        <div className="space-y-3">
          {queue.map((project, index) => (
            <Link 
              key={project.id} 
              to={`/projects/${project.id}`}
              className="block"
              data-testid={`queue-item-${index}`}
            >
              <Card className="hover:shadow-md hover:border-teal-200 transition-all duration-200 group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Position */}
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-slate-600">#{index + 1}</span>
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                          {project.title}
                        </h3>
                        <Badge variant="outline" className="flex-shrink-0">
                          {statusLabels[project.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>{project.municipality_name}</span>
                        <span>•</span>
                        <span>{typeLabels[project.project_type]}</span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="hidden md:flex items-center gap-6">
                      {/* Priority */}
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">Prioridade</p>
                        <StarRating value={project.priority} readonly size="sm" />
                      </div>

                      {/* Complexity */}
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">Complexidade</p>
                        {project.complexity ? (
                          <Badge className={complexityColors[project.complexity]}>
                            {project.complexity === 'minima' && 'Mínima'}
                            {project.complexity === 'media' && 'Média'}
                            {project.complexity === 'alta' && 'Alta'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">N/A</Badge>
                        )}
                      </div>

                      {/* IPR Score */}
                      <div className="text-center min-w-[80px]">
                        <p className="text-xs text-slate-400 mb-1">IPR Score</p>
                        <p className="text-lg font-bold text-teal-600">
                          {project.ipr_score?.toFixed(2) || '0.00'}
                        </p>
                      </div>

                      {/* Progress */}
                      <div className="min-w-[100px]">
                        <p className="text-xs text-slate-400 mb-1">Progresso</p>
                        <div className="flex items-center gap-2">
                          <Progress value={project.progress_percent || 0} className="h-2 flex-1" />
                          <span className="text-xs font-medium">{project.progress_percent?.toFixed(0) || 0}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <ListOrdered className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              Fila vazia
            </h3>
            <p className="text-slate-500">
              Não há projetos aguardando na fila técnica no momento
            </p>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legenda - Cálculo do IPR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm">
            IPR = ((Impacto × 3) + (Urgência × 2) + (Custo × 1)) / Complexidade
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div>
              <p className="text-slate-500">Impacto</p>
              <p className="font-medium">Peso 3</p>
            </div>
            <div>
              <p className="text-slate-500">Urgência</p>
              <p className="font-medium">Peso 2</p>
            </div>
            <div>
              <p className="text-slate-500">Custo</p>
              <p className="font-medium">Peso 1</p>
            </div>
            <div>
              <p className="text-slate-500">Complexidade</p>
              <p className="font-medium">Divisor (1/5/10)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QueuePage;
