import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Users, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import StarRating from './StarRating';
import { cn } from '../../lib/utils';

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

export const ProjectCard = ({ project, showMunicipality = true }) => {
  return (
    <Link 
      to={`/projects/${project.id}`}
      className="block"
      data-testid={`project-card-${project.id}`}
    >
      <div className="bg-white rounded-lg border border-slate-200 p-5 transition-all duration-200 hover:shadow-md hover:border-teal-200 group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
              {project.title}
            </h3>
            {showMunicipality && (
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {project.municipality_name}
              </p>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors flex-shrink-0" />
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className={cn("text-xs", statusColors[project.status])}>
            {statusLabels[project.status]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {typeLabels[project.project_type]}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <StarRating value={project.priority} readonly size="sm" />
          <span className="text-xs text-slate-500">
            IPR: {project.ipr_score?.toFixed(1) || '0.0'}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Progresso</span>
            <span className="font-medium">{project.progress_percent?.toFixed(0) || 0}%</span>
          </div>
          <Progress value={project.progress_percent || 0} className="h-1.5" />
        </div>
        
        {project.assigned_team?.length > 0 && (
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">
              {project.assigned_team.length} técnico(s)
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProjectCard;
