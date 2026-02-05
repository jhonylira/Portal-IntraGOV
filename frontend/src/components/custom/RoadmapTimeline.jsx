import React from 'react';
import { Check, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const RoadmapTimeline = ({ stages = [], onStageClick, readonly = false }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return <Circle className="w-3 h-3" />;
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-500 text-white';
      case 'in_progress':
        return 'border-teal-500 bg-teal-50 text-teal-600';
      default:
        return 'border-slate-300 bg-white text-slate-400';
    }
  };

  const getConnectorClass = (currentStatus, nextStatus) => {
    if (currentStatus === 'completed') {
      return 'bg-green-500';
    }
    return 'bg-slate-200';
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-thin pb-4">
      <div className="flex items-start min-w-max px-4">
        {stages.map((stage, index) => (
          <React.Fragment key={index}>
            <div 
              className={cn(
                "roadmap-node flex flex-col items-center",
                !readonly && "cursor-pointer group"
              )}
              onClick={() => !readonly && onStageClick && onStageClick(index, stage)}
              data-testid={`roadmap-stage-${index}`}
            >
              <div 
                className={cn(
                  "roadmap-node-circle w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  getStatusClasses(stage.status),
                  !readonly && "group-hover:scale-110 group-hover:shadow-md"
                )}
              >
                {getStatusIcon(stage.status)}
              </div>
              
              <div className="mt-3 text-center max-w-[120px]">
                <p className={cn(
                  "text-xs font-medium leading-tight",
                  stage.status === 'completed' && "text-green-700",
                  stage.status === 'in_progress' && "text-teal-700",
                  stage.status === 'pending' && "text-slate-500"
                )}>
                  {stage.name}
                </p>
                {stage.completed_at && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(stage.completed_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
            
            {index < stages.length - 1 && (
              <div 
                className={cn(
                  "roadmap-connector h-0.5 w-16 mt-5 flex-shrink-0",
                  getConnectorClass(stage.status, stages[index + 1]?.status)
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default RoadmapTimeline;
