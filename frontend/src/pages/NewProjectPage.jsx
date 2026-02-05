import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, Upload, Paperclip, X, Info, Clock, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import StarRating from '../components/custom/StarRating';
import { useAuth } from '../contexts/AuthContext';
import { createProject, getMunicipalities, municipalAIAnalysis } from '../services/api';
import { toast } from 'sonner';

function NewProjectPage() {
  const navigate = useNavigate();
  const { user, isMunicipal } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [municipalities, setMunicipalities] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('');
  const [municipalityId, setMunicipalityId] = useState(user?.municipality_id || '');
  const [priority, setPriority] = useState(3);
  const [location, setLocation] = useState('');
  const [scope, setScope] = useState('');
  const [purpose, setPurpose] = useState('');
  const [impactScore, setImpactScore] = useState(5);
  const [urgencyScore, setUrgencyScore] = useState(5);
  const [costScore, setCostScore] = useState(5);
  const [desiredDeadline, setDesiredDeadline] = useState('medio');
  const [attachments, setAttachments] = useState([]);

  useEffect(function loadData() {
    getMunicipalities().then(function(res) {
      setMunicipalities(res.data);
      if (isMunicipal && user && user.municipality_id) setMunicipalityId(user.municipality_id);
    }).catch(console.error);
  }, [isMunicipal, user]);

  function addAttachment() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.jpg,.jpeg,.png,.txt';
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (file) setAttachments(function(prev) { return prev.concat([{ id: Date.now().toString(), filename: file.name, file_type: file.name.split('.').pop().toLowerCase(), file_size: file.size }]); });
    };
    input.click();
  }

  function removeAttachment(id) { setAttachments(function(prev) { return prev.filter(function(a) { return a.id !== id; }); }); }

  function runAnalysis() {
    setAnalyzing(true);
    municipalAIAnalysis({ title: title, description: description, project_type: projectType, location: location, scope: scope, purpose: purpose, impact_score: impactScore, urgency_score: urgencyScore, desired_deadline: desiredDeadline, attachments: attachments }).then(function(res) {
      setAiAnalysis(res.data);
      setAnalyzing(false);
    }).catch(function() { toast.error('Erro na análise'); setAnalyzing(false); });
  }

  function isValid() {
    if (step === 1) return title && description && projectType && municipalityId;
    if (step === 4) return priority > 0 && desiredDeadline;
    return true;
  }

  function next() {
    if (isValid()) {
      if (step === 4) runAnalysis();
      setStep(function(s) { return Math.min(s + 1, 6); });
    }
  }

  function back() { setStep(function(s) { return Math.max(s - 1, 1); }); }

  function submit() {
    setLoading(true);
    createProject({ title: title, description: description, project_type: projectType, municipality_id: municipalityId, priority: priority, location: location, scope: scope, purpose: purpose, impact_score: impactScore, urgency_score: urgencyScore, cost_score: costScore, desired_deadline: desiredDeadline }).then(function(res) {
      toast.success('Solicitação criada!');
      navigate('/projects/' + res.data.id);
    }).catch(function(e) {
      toast.error((e.response && e.response.data && e.response.data.detail) || 'Erro');
      setLoading(false);
    });
  }

  var selectedMun = null;
  for (var i = 0; i < municipalities.length; i++) {
    if (municipalities[i].id === municipalityId) { selectedMun = municipalities[i]; break; }
  }

  function renderStep1() {
    return React.createElement('div', { className: 'space-y-4' },
      React.createElement('div', null, React.createElement(Label, null, 'Título *'), React.createElement(Input, { value: title, onChange: function(e) { setTitle(e.target.value); }, placeholder: 'Ex: Pavimentação Rua das Flores', className: 'mt-1' })),
      React.createElement('div', null, React.createElement(Label, null, 'Descrição *'), React.createElement(Textarea, { value: description, onChange: function(e) { setDescription(e.target.value); }, placeholder: 'Descreva o projeto...', className: 'mt-1 min-h-[100px]' })),
      React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
        React.createElement('div', null, React.createElement(Label, null, 'Tipo *'), React.createElement(Select, { value: projectType, onValueChange: setProjectType }, React.createElement(SelectTrigger, { className: 'mt-1' }, React.createElement(SelectValue, { placeholder: 'Selecione' })), React.createElement(SelectContent, null, React.createElement(SelectItem, { value: 'pavimentacao' }, 'Pavimentação'), React.createElement(SelectItem, { value: 'edificacao' }, 'Edificação'), React.createElement(SelectItem, { value: 'infraestrutura' }, 'Infraestrutura')))),
        React.createElement('div', null, React.createElement(Label, null, 'Município *'), React.createElement(Select, { value: municipalityId, onValueChange: setMunicipalityId, disabled: isMunicipal }, React.createElement(SelectTrigger, { className: 'mt-1' }, React.createElement(SelectValue, { placeholder: 'Selecione' })), React.createElement(SelectContent, null, municipalities.map(function(m) { return React.createElement(SelectItem, { key: m.id, value: m.id }, m.name); }))))
      )
    );
  }

  function renderStep2() {
    return React.createElement('div', { className: 'space-y-4' },
      React.createElement('div', null, React.createElement(Label, null, 'Localização'), React.createElement(Input, { value: location, onChange: function(e) { setLocation(e.target.value); }, placeholder: 'Ex: Bairro Centro', className: 'mt-1' })),
      React.createElement('div', null, React.createElement(Label, null, 'Escopo'), React.createElement(Textarea, { value: scope, onChange: function(e) { setScope(e.target.value); }, placeholder: 'Escopo técnico...', className: 'mt-1' })),
      React.createElement('div', null, React.createElement(Label, null, 'Finalidade'), React.createElement(Textarea, { value: purpose, onChange: function(e) { setPurpose(e.target.value); }, placeholder: 'Finalidade e benefícios...', className: 'mt-1' }))
    );
  }

  function renderStep3() {
    return React.createElement('div', { className: 'space-y-4' },
      React.createElement('div', null,
        React.createElement(Label, { className: 'text-base' }, 'Arquivos Complementares'),
        React.createElement('p', { className: 'text-sm text-slate-500 mt-1 mb-4' }, 'Anexos são opcionais mas ajudam na análise.'),
        React.createElement('div', { className: 'border-2 border-dashed border-slate-200 rounded-lg p-6 text-center' },
          React.createElement(Upload, { className: 'w-8 h-8 text-slate-400 mx-auto mb-2' }),
          React.createElement(Button, { variant: 'outline', onClick: addAttachment }, React.createElement(Paperclip, { className: 'w-4 h-4 mr-2' }), 'Adicionar')
        )
      ),
      attachments.length > 0 && React.createElement('div', { className: 'space-y-2' },
        React.createElement(Label, null, 'Anexados (', attachments.length, ')'),
        attachments.map(function(a) {
          return React.createElement('div', { key: a.id, className: 'flex items-center justify-between p-3 bg-slate-50 rounded-lg' },
            React.createElement('span', { className: 'text-sm' }, a.filename),
            React.createElement(Button, { variant: 'ghost', size: 'icon', onClick: function() { removeAttachment(a.id); } }, React.createElement(X, { className: 'w-4 h-4' }))
          );
        })
      ),
      React.createElement(Alert, null, React.createElement(Info, { className: 'w-4 h-4' }), React.createElement(AlertDescription, null, React.createElement('strong', null, 'Documentos comuns: '), projectType === 'pavimentacao' ? 'Topográfico, Matrícula' : projectType === 'edificacao' ? 'Planta, Projeto arquitetônico' : 'Planialtimétrico, Estudo hidrológico'))
    );
  }

  function renderStep4() {
    return React.createElement('div', { className: 'space-y-6' },
      React.createElement('div', null, React.createElement(Label, { className: 'text-base' }, 'Prioridade'), React.createElement('p', { className: 'text-sm text-slate-500 mb-3' }, '5 estrelas = máxima prioridade'), React.createElement(StarRating, { value: priority, onChange: setPriority, size: 'xl', showLabel: true })),
      React.createElement('div', null, React.createElement(Label, { className: 'text-base' }, 'Prazo Desejado'), React.createElement('p', { className: 'text-sm text-slate-500 mb-3' }, 'Expectativa informativa, não vinculante.'), React.createElement(Select, { value: desiredDeadline, onValueChange: setDesiredDeadline }, React.createElement(SelectTrigger, null, React.createElement(SelectValue, null)), React.createElement(SelectContent, null, React.createElement(SelectItem, { value: 'baixo' }, 'Baixo'), React.createElement(SelectItem, { value: 'medio' }, 'Médio'), React.createElement(SelectItem, { value: 'alto' }, 'Alto')))),
      React.createElement('div', null, React.createElement(Label, null, 'Impacto: ', impactScore, '/10'), React.createElement(Slider, { value: [impactScore], onValueChange: function(v) { setImpactScore(v[0]); }, min: 1, max: 10, className: 'mt-2' })),
      React.createElement('div', null, React.createElement(Label, null, 'Urgência: ', urgencyScore, '/10'), React.createElement(Slider, { value: [urgencyScore], onValueChange: function(v) { setUrgencyScore(v[0]); }, min: 1, max: 10, className: 'mt-2' }))
    );
  }

  function renderStep5() {
    return React.createElement('div', { className: 'space-y-4' },
      React.createElement(Alert, { className: 'bg-teal-50 border-teal-200' }, React.createElement(Sparkles, { className: 'w-4 h-4 text-teal-600' }), React.createElement(AlertTitle, { className: 'text-teal-800' }, 'Análise Orientativa'), React.createElement(AlertDescription, { className: 'text-teal-700' }, 'A IA é apenas consultiva, sem poder decisório.')),
      analyzing && React.createElement('div', { className: 'text-center py-12' }, React.createElement(Loader2, { className: 'w-12 h-12 animate-spin text-teal-600 mx-auto mb-4' }), React.createElement('p', null, 'Analisando...')),
      !analyzing && aiAnalysis && React.createElement('div', { className: 'space-y-4' },
        React.createElement(Card, null, React.createElement(CardHeader, { className: 'pb-3' }, React.createElement(CardTitle, { className: 'text-base' }, 'Suficiência')), React.createElement(CardContent, null, React.createElement(Badge, { className: aiAnalysis.information_sufficiency === 'suficiente' ? 'bg-green-100 text-green-700' : aiAnalysis.information_sufficiency === 'parcialmente_suficiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700' }, aiAnalysis.information_sufficiency === 'suficiente' ? 'Suficientes' : aiAnalysis.information_sufficiency === 'parcialmente_suficiente' ? 'Parcialmente' : 'Insuficientes'))),
        React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
          React.createElement(Card, null, React.createElement(CardContent, { className: 'pt-6' }, React.createElement('p', { className: 'text-sm text-slate-500' }, 'Complexidade'), React.createElement(Badge, { className: aiAnalysis.estimated_complexity === 'minima' ? 'bg-green-100' : aiAnalysis.estimated_complexity === 'media' ? 'bg-yellow-100' : 'bg-red-100' }, aiAnalysis.estimated_complexity))),
          React.createElement(Card, null, React.createElement(CardContent, { className: 'pt-6' }, React.createElement('p', { className: 'text-sm text-slate-500' }, 'Prazo Referencial'), React.createElement('p', { className: 'text-xl font-bold' }, aiAnalysis.suggested_deadline_days || '?', ' dias')))
        ),
        aiAnalysis.technical_explanation && React.createElement(Card, null, React.createElement(CardContent, { className: 'pt-6' }, React.createElement('p', { className: 'text-sm text-slate-600' }, aiAnalysis.technical_explanation))),
        React.createElement(Alert, { className: 'bg-amber-50 border-amber-200' }, React.createElement(AlertTriangle, { className: 'w-4 h-4 text-amber-600' }), React.createElement(AlertDescription, { className: 'text-amber-800 text-xs' }, React.createElement('strong', null, 'IMPORTANTE:'), ' Análise MERAMENTE ORIENTATIVA. Será validada por técnico humano.')),
        React.createElement(Button, { variant: 'outline', onClick: runAnalysis, className: 'w-full' }, React.createElement(Sparkles, { className: 'w-4 h-4 mr-2' }), 'Refazer Análise')
      )
    );
  }

  function renderStep6() {
    return React.createElement('div', { className: 'space-y-4' },
      React.createElement('div', { className: 'bg-slate-50 rounded-lg p-6' },
        React.createElement('h3', { className: 'font-semibold text-lg mb-4' }, 'Resumo'),
        React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
          React.createElement('div', null, React.createElement('p', { className: 'text-sm text-slate-500' }, 'Título'), React.createElement('p', { className: 'font-medium' }, title)),
          React.createElement('div', null, React.createElement('p', { className: 'text-sm text-slate-500' }, 'Tipo'), React.createElement('p', { className: 'font-medium' }, projectType === 'pavimentacao' ? 'Pavimentação' : projectType === 'edificacao' ? 'Edificação' : 'Infraestrutura')),
          React.createElement('div', null, React.createElement('p', { className: 'text-sm text-slate-500' }, 'Município'), React.createElement('p', { className: 'font-medium' }, selectedMun ? selectedMun.name : '-')),
          React.createElement('div', null, React.createElement('p', { className: 'text-sm text-slate-500' }, 'Prioridade'), React.createElement(StarRating, { value: priority, readonly: true, size: 'sm' }))
        )
      ),
      React.createElement(Alert, { className: 'bg-blue-50 border-blue-200' }, React.createElement(Info, { className: 'w-4 h-4 text-blue-600' }), React.createElement(AlertDescription, { className: 'text-blue-800' }, 'Sua solicitação será analisada pela equipe técnica AMVALI.'))
    );
  }

  var steps = ['Informações', 'Localização', 'Anexos', 'Prioridade', 'Análise IA', 'Confirmação'];

  return React.createElement('div', { className: 'max-w-4xl mx-auto space-y-6 fade-in', 'data-testid': 'new-project-page' },
    React.createElement('div', { className: 'flex items-center gap-4' },
      React.createElement(Button, { variant: 'ghost', size: 'icon', onClick: function() { navigate('/projects'); } }, React.createElement(ArrowLeft, { className: 'w-5 h-5' })),
      React.createElement('div', null, React.createElement('h1', { className: 'text-2xl font-bold text-slate-900' }, 'Nova Solicitação'), React.createElement('p', { className: 'text-slate-500' }, 'Preencha os dados do projeto'))
    ),
    React.createElement('div', { className: 'flex items-center justify-between overflow-x-auto pb-2' },
      steps.map(function(s, i) {
        return React.createElement(React.Fragment, { key: i },
          React.createElement('div', { className: 'flex flex-col items-center min-w-[60px]' },
            React.createElement('div', { className: 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ' + (step > i + 1 ? 'bg-teal-500 text-white' : step === i + 1 ? 'bg-teal-100 text-teal-700 border-2 border-teal-500' : 'bg-slate-100 text-slate-400') }, i + 1),
            React.createElement('span', { className: 'text-xs mt-1 ' + (step >= i + 1 ? 'text-teal-600' : 'text-slate-400') }, s)
          ),
          i < 5 && React.createElement('div', { className: 'flex-1 h-0.5 mx-1 ' + (step > i + 1 ? 'bg-teal-500' : 'bg-slate-200') })
        );
      })
    ),
    React.createElement(Card, null, React.createElement(CardContent, { className: 'pt-6' },
      step === 1 && renderStep1(),
      step === 2 && renderStep2(),
      step === 3 && renderStep3(),
      step === 4 && renderStep4(),
      step === 5 && renderStep5(),
      step === 6 && renderStep6(),
      React.createElement('div', { className: 'flex justify-between mt-8 pt-6 border-t' },
        React.createElement(Button, { variant: 'outline', onClick: back, disabled: step === 1 }, React.createElement(ArrowLeft, { className: 'w-4 h-4 mr-2' }), 'Voltar'),
        step < 6 ? React.createElement(Button, { onClick: next, disabled: !isValid() || analyzing, className: 'bg-teal-600 hover:bg-teal-700' }, analyzing && React.createElement(Loader2, { className: 'w-4 h-4 mr-2 animate-spin' }), 'Próximo', React.createElement(ArrowRight, { className: 'w-4 h-4 ml-2' }))
          : React.createElement(Button, { onClick: submit, disabled: loading, className: 'bg-teal-600 hover:bg-teal-700' }, loading ? React.createElement(Loader2, { className: 'w-4 h-4 mr-2 animate-spin' }) : React.createElement(CheckCircle2, { className: 'w-4 h-4 mr-2' }), 'Confirmar')
      )
    ))
  );
}

export default NewProjectPage;
