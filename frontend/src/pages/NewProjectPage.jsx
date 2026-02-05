import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, MapPin, FileText, BarChart3, CheckCircle2, Upload, Paperclip, X, AlertCircle, Info, Clock, Sparkles, FileCheck, AlertTriangle } from 'lucide-react';
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

function AttachmentItem({ attachment, onRemove }) {
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-slate-500" />
        <div>
          <p className="text-sm font-medium text-slate-700">{attachment.filename}</p>
          <p className="text-xs text-slate-400">{formatSize(attachment.file_size)}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onRemove(attachment.id)}><X className="w-4 h-4" /></Button>
    </div>
  );
}

function AIAnalysisResult({ analysis, onRefresh }) {
  if (!analysis) return null;
  const suffColors = { suficiente: 'bg-green-100 text-green-700', parcialmente_suficiente: 'bg-yellow-100 text-yellow-700', insuficiente: 'bg-red-100 text-red-700' };
  const suffLabels = { suficiente: 'Suficientes', parcialmente_suficiente: 'Parcialmente Suficientes', insuficiente: 'Insuficientes' };
  const compLabels = { compativel: 'Compatível', parcialmente_compativel: 'Parcialmente Compatível', incompativel: 'Incompatível' };
  const compColors = { compativel: 'bg-green-100 text-green-700', parcialmente_compativel: 'bg-yellow-100 text-yellow-700', incompativel: 'bg-red-100 text-red-700' };
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><FileCheck className="w-5 h-5" />Suficiência das Informações</CardTitle></CardHeader>
        <CardContent>
          <Badge className={suffColors[analysis.information_sufficiency] || 'bg-slate-100'}>{suffLabels[analysis.information_sufficiency] || analysis.information_sufficiency}</Badge>
          {analysis.missing_documents && analysis.missing_documents.length > 0 && (
            <div className="mt-4"><p className="text-sm font-medium text-slate-700 mb-2">Documentos não identificados:</p>
              <ul className="space-y-1">{analysis.missing_documents.map((doc, i) => <li key={i} className="text-sm text-slate-600 flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5 text-amber-500" />{doc}</li>)}</ul>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-4">
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">Complexidade</CardTitle></CardHeader>
          <CardContent><Badge className={analysis.estimated_complexity === 'minima' ? 'bg-green-100 text-green-700' : analysis.estimated_complexity === 'media' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>{analysis.estimated_complexity === 'minima' ? 'Mínima' : analysis.estimated_complexity === 'media' ? 'Média' : 'Alta'}</Badge></CardContent>
        </Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">Compatibilidade Prazo</CardTitle></CardHeader>
          <CardContent><Badge className={compColors[analysis.deadline_compatibility] || 'bg-slate-100'}>{compLabels[analysis.deadline_compatibility] || 'Indefinido'}</Badge></CardContent>
        </Card>
      </div>
      {analysis.suggested_deadline_days && (
        <Card className="bg-slate-50"><CardContent className="pt-6 flex items-center gap-3"><Clock className="w-8 h-8 text-slate-500" /><div><p className="text-sm text-slate-500">Prazo Referencial</p><p className="text-2xl font-bold">{analysis.suggested_deadline_days} dias</p></div></CardContent></Card>
      )}
      {analysis.technical_explanation && <Card><CardHeader className="pb-3"><CardTitle className="text-base">Explicação</CardTitle></CardHeader><CardContent><p className="text-sm text-slate-600">{analysis.technical_explanation}</p></CardContent></Card>}
      <Alert className="bg-amber-50 border-amber-200"><AlertTriangle className="w-4 h-4 text-amber-600" /><AlertDescription className="text-amber-800 text-xs"><strong>IMPORTANTE:</strong> Análise MERAMENTE ORIENTATIVA. Será validada por técnico humano.</AlertDescription></Alert>
      <Button variant="outline" onClick={onRefresh} className="w-full"><Sparkles className="w-4 h-4 mr-2" />Refazer Análise</Button>
    </div>
  );
}

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

  useEffect(() => {
    getMunicipalities().then(res => {
      setMunicipalities(res.data);
      if (isMunicipal && user?.municipality_id) setMunicipalityId(user.municipality_id);
    }).catch(console.error);
  }, [isMunicipal, user]);

  const addAttachment = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.jpg,.jpeg,.png,.txt';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) setAttachments(prev => [...prev, { id: Date.now().toString(), filename: file.name, file_type: file.name.split('.').pop().toLowerCase(), file_size: file.size }]);
    };
    input.click();
  };

  const removeAttachment = (id) => setAttachments(prev => prev.filter(a => a.id !== id));

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await municipalAIAnalysis({ title, description, project_type: projectType, location, scope, purpose, impact_score: impactScore, urgency_score: urgencyScore, desired_deadline: desiredDeadline, attachments: attachments.map(a => ({ filename: a.filename, file_type: a.file_type })) });
      setAiAnalysis(res.data);
    } catch (e) { toast.error('Erro na análise'); }
    setAnalyzing(false);
  };

  const isValid = () => {
    if (step === 1) return title && description && projectType && municipalityId;
    if (step === 4) return priority > 0 && desiredDeadline;
    return true;
  };

  const next = async () => {
    if (isValid()) {
      if (step === 4) await runAnalysis();
      setStep(s => Math.min(s + 1, 6));
    }
  };

  const back = () => setStep(s => Math.max(s - 1, 1));

  const submit = async () => {
    setLoading(true);
    try {
      const res = await createProject({ title, description, project_type: projectType, municipality_id: municipalityId, priority, location, scope, purpose, impact_score: impactScore, urgency_score: urgencyScore, cost_score: costScore, desired_deadline: desiredDeadline });
      toast.success('Solicitação criada!');
      navigate('/projects/' + res.data.id);
    } catch (e) { toast.error(e.response?.data?.detail || 'Erro'); }
    setLoading(false);
  };

  const selectedMun = municipalities.find(m => m.id === municipalityId);
  const steps = ['Informações', 'Localização', 'Anexos', 'Prioridade', 'Análise IA', 'Confirmação'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in" data-testid="new-project-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}><ArrowLeft className="w-5 h-5" /></Button>
        <div><h1 className="text-2xl font-bold text-slate-900">Nova Solicitação</h1><p className="text-slate-500">Preencha os dados do projeto</p></div>
      </div>

      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center min-w-[60px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step > i ? 'bg-teal-500 text-white' : step === i + 1 ? 'bg-teal-100 text-teal-700 border-2 border-teal-500' : 'bg-slate-100 text-slate-400'}`}>{i + 1}</div>
              <span className={`text-xs mt-1 ${step >= i + 1 ? 'text-teal-600' : 'text-slate-400'}`}>{s}</span>
            </div>
            {i < 5 && <div className={`flex-1 h-0.5 mx-1 ${step > i + 1 ? 'bg-teal-500' : 'bg-slate-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <Card><CardContent className="pt-6">
        {step === 1 && (
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Pavimentação Rua das Flores" className="mt-1" /></div>
            <div><Label>Descrição *</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o projeto..." className="mt-1 min-h-[100px]" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipo *</Label><Select value={projectType} onValueChange={setProjectType}><SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="pavimentacao">Pavimentação</SelectItem><SelectItem value="edificacao">Edificação</SelectItem><SelectItem value="infraestrutura">Infraestrutura</SelectItem></SelectContent></Select></div>
              <div><Label>Município *</Label><Select value={municipalityId} onValueChange={setMunicipalityId} disabled={isMunicipal}><SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{municipalities.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div><Label>Localização</Label><Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Bairro Centro" className="mt-1" /></div>
            <div><Label>Escopo</Label><Textarea value={scope} onChange={e => setScope(e.target.value)} placeholder="Escopo técnico..." className="mt-1" /></div>
            <div><Label>Finalidade</Label><Textarea value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Finalidade e benefícios..." className="mt-1" /></div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div><Label className="text-base">Arquivos Complementares</Label><p className="text-sm text-slate-500 mt-1 mb-4">Anexos são opcionais mas ajudam na análise.</p>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <Button variant="outline" onClick={addAttachment}><Paperclip className="w-4 h-4 mr-2" />Adicionar Arquivo</Button>
              </div>
            </div>
            {attachments.length > 0 && <div className="space-y-2"><Label>Anexados ({attachments.length})</Label>{attachments.map(a => <AttachmentItem key={a.id} attachment={a} onRemove={removeAttachment} />)}</div>}
            <Alert><Info className="w-4 h-4" /><AlertDescription><strong>Documentos comuns:</strong> {projectType === 'pavimentacao' ? 'Topográfico, Matrícula, Projeto geométrico' : projectType === 'edificacao' ? 'Planta situação, Projeto arquitetônico' : 'Planialtimétrico, Estudo hidrológico'}</AlertDescription></Alert>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div><Label className="text-base">Prioridade</Label><p className="text-sm text-slate-500 mb-3">5 estrelas = máxima prioridade</p><StarRating value={priority} onChange={setPriority} size="xl" showLabel /></div>
            <div><Label className="text-base">Prazo Desejado</Label><p className="text-sm text-slate-500 mb-3">Expectativa informativa, não vinculante.</p>
              <Select value={desiredDeadline} onValueChange={setDesiredDeadline}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="baixo">Baixo (sem urgência)</SelectItem><SelectItem value="medio">Médio (regular)</SelectItem><SelectItem value="alto">Alto (urgente)</SelectItem></SelectContent></Select>
            </div>
            <div><Label>Impacto: {impactScore}/10</Label><Slider value={[impactScore]} onValueChange={([v]) => setImpactScore(v)} min={1} max={10} className="mt-2" /></div>
            <div><Label>Urgência: {urgencyScore}/10</Label><Slider value={[urgencyScore]} onValueChange={([v]) => setUrgencyScore(v)} min={1} max={10} className="mt-2" /></div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <Alert className="bg-teal-50 border-teal-200"><Sparkles className="w-4 h-4 text-teal-600" /><AlertTitle className="text-teal-800">Análise Orientativa</AlertTitle><AlertDescription className="text-teal-700">A IA é apenas consultiva, sem poder decisório.</AlertDescription></Alert>
            {analyzing ? <div className="text-center py-12"><Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" /><p>Analisando...</p></div> : <AIAnalysisResult analysis={aiAnalysis} onRefresh={runAnalysis} />}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4">Resumo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-slate-500">Título</p><p className="font-medium">{title}</p></div>
                <div><p className="text-sm text-slate-500">Tipo</p><p className="font-medium">{projectType === 'pavimentacao' ? 'Pavimentação' : projectType === 'edificacao' ? 'Edificação' : 'Infraestrutura'}</p></div>
                <div><p className="text-sm text-slate-500">Município</p><p className="font-medium">{selectedMun?.name || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Prioridade</p><StarRating value={priority} readonly size="sm" /></div>
                <div><p className="text-sm text-slate-500">Prazo Desejado</p><p className="font-medium">{desiredDeadline === 'baixo' ? 'Baixo' : desiredDeadline === 'medio' ? 'Médio' : 'Alto'}</p></div>
                <div><p className="text-sm text-slate-500">Anexos</p><p className="font-medium">{attachments.length}</p></div>
              </div>
            </div>
            <Alert className="bg-blue-50 border-blue-200"><Info className="w-4 h-4 text-blue-600" /><AlertDescription className="text-blue-800">Sua solicitação será analisada pela equipe técnica AMVALI.</AlertDescription></Alert>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button variant="outline" onClick={back} disabled={step === 1}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
          {step < 6 ? <Button onClick={next} disabled={!isValid() || analyzing} className="bg-teal-600 hover:bg-teal-700">{analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Próximo<ArrowRight className="w-4 h-4 ml-2" /></Button>
            : <Button onClick={submit} disabled={loading} className="bg-teal-600 hover:bg-teal-700">{loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}Confirmar</Button>}
        </div>
      </CardContent></Card>
    </div>
  );
}

export default NewProjectPage;
