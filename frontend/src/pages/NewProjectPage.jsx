import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Loader2, MapPin, FileText, BarChart3, 
  CheckCircle2, Upload, Paperclip, X, AlertCircle, Info, Clock,
  Sparkles, FileCheck, AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import StarRating from '../components/custom/StarRating';
import { useAuth } from '../contexts/AuthContext';
import { createProject, getMunicipalities, municipalAIAnalysis } from '../services/api';
import { toast } from 'sonner';

const steps = [
  { id: 1, title: 'Informações Básicas', icon: FileText },
  { id: 2, title: 'Localização e Escopo', icon: MapPin },
  { id: 3, title: 'Anexos', icon: Paperclip },
  { id: 4, title: 'Prioridade e Prazo', icon: Clock },
  { id: 5, title: 'Análise IA', icon: Sparkles },
  { id: 6, title: 'Confirmação', icon: CheckCircle2 },
];

const deadlineLabels = {
  baixo: 'Baixo (sem urgência)',
  medio: 'Médio (prazo regular)',
  alto: 'Alto (urgente)'
};

const sufficiencyColors = {
  suficiente: 'bg-green-100 text-green-700 border-green-300',
  parcialmente_suficiente: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  insuficiente: 'bg-red-100 text-red-700 border-red-300'
};

const sufficiencyLabels = {
  suficiente: 'Suficientes',
  parcialmente_suficiente: 'Parcialmente Suficientes',
  insuficiente: 'Insuficientes'
};

const compatibilityColors = {
  compativel: 'bg-green-100 text-green-700',
  parcialmente_compativel: 'bg-yellow-100 text-yellow-700',
  incompativel: 'bg-red-100 text-red-700'
};

function NewProjectPage() {
  const navigate = useNavigate();
  const { user, isMunicipal } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [municipalities, setMunicipalities] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: '',
    municipality_id: user?.municipality_id || '',
    priority: 3,
    location: '',
    scope: '',
    purpose: '',
    impact_score: 5,
    urgency_score: 5,
    cost_score: 5,
    desired_deadline: 'medio',
    attachments: []
  });

  useEffect(() => {
    loadMunicipalities();
  }, []);

  const loadMunicipalities = async () => {
    try {
      const response = await getMunicipalities();
      setMunicipalities(response.data);
      if (isMunicipal && user?.municipality_id) {
        setFormData(prev => ({ ...prev, municipality_id: user.municipality_id }));
      }
    } catch (error) {
      console.error('Failed to load municipalities:', error);
    }
  };

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAttachment = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.jpg,.jpeg,.png,.txt';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const attachment = {
          id: Date.now().toString(),
          filename: file.name,
          file_type: file.name.split('.').pop().toLowerCase(),
          file_size: file.size,
          file: file
        };
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, attachment]
        }));
      }
    };
    input.click();
  };

  const handleRemoveAttachment = (attachmentId) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(a => a.id !== attachmentId)
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const runAIAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await municipalAIAnalysis({
        title: formData.title,
        description: formData.description,
        project_type: formData.project_type,
        location: formData.location,
        scope: formData.scope,
        purpose: formData.purpose,
        impact_score: formData.impact_score,
        urgency_score: formData.urgency_score,
        desired_deadline: formData.desired_deadline,
        attachments: formData.attachments.map(a => ({ filename: a.filename, file_type: a.file_type }))
      });
      setAiAnalysis(response.data);
    } catch (error) {
      toast.error('Erro na análise de IA');
    } finally {
      setAnalyzing(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.description && formData.project_type && formData.municipality_id;
      case 2:
        return true;
      case 3:
        return true; // Attachments are optional
      case 4:
        return formData.priority > 0 && formData.desired_deadline;
      case 5:
        return true; // AI analysis is optional
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (isStepValid()) {
      if (currentStep === 4) {
        // Run AI analysis when moving to step 5
        await runAIAnalysis();
      }
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await createProject({
        ...formData,
        attachments: formData.attachments.map(a => ({
          filename: a.filename,
          file_type: a.file_type,
          file_size: a.file_size
        }))
      });
      toast.success('Solicitação criada com sucesso!');
      navigate(`/projects/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const selectedMunicipality = municipalities.find(m => m.id === formData.municipality_id);

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in" data-testid="new-project-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/projects')} data-testid="back-button">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova Solicitação de Projeto</h1>
          <p className="text-slate-500">Preencha os dados para solicitar um novo projeto técnico</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center min-w-[80px]">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                currentStep >= step.id 
                  ? 'border-teal-500 bg-teal-500 text-white' 
                  : 'border-slate-300 bg-white text-slate-400'
              }`}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs mt-2 text-center ${
                currentStep >= step.id ? 'text-teal-600 font-medium' : 'text-slate-400'
              }`}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 min-w-[20px] ${
                currentStep > step.id ? 'bg-teal-500' : 'bg-slate-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form Steps */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="title">Título do Projeto *</Label>
                <Input id="title" value={formData.title} onChange={(e) => updateForm('title', e.target.value)}
                  placeholder="Ex: Pavimentação da Rua das Flores" className="mt-1" data-testid="input-title" />
              </div>
              <div>
                <Label htmlFor="description">Descrição Detalhada *</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="Descreva o projeto em detalhes, incluindo objetivos, justificativas e necessidades..." 
                  className="mt-1 min-h-[120px]" data-testid="input-description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Projeto *</Label>
                  <Select value={formData.project_type} onValueChange={(value) => updateForm('project_type', value)}>
                    <SelectTrigger className="mt-1" data-testid="select-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pavimentacao">Pavimentação</SelectItem>
                      <SelectItem value="edificacao">Edificação</SelectItem>
                      <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Município *</Label>
                  <Select value={formData.municipality_id} onValueChange={(value) => updateForm('municipality_id', value)} disabled={isMunicipal}>
                    <SelectTrigger className="mt-1" data-testid="select-municipality">
                      <SelectValue placeholder="Selecione o município" />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalities.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location and Scope */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="location">Localização</Label>
                <Input id="location" value={formData.location} onChange={(e) => updateForm('location', e.target.value)}
                  placeholder="Ex: Bairro Centro, Rua Principal, próximo à praça" className="mt-1" data-testid="input-location" />
              </div>
              <div>
                <Label htmlFor="scope">Escopo do Projeto</Label>
                <Textarea id="scope" value={formData.scope} onChange={(e) => updateForm('scope', e.target.value)}
                  placeholder="Detalhe o escopo técnico: área, dimensões, especificações..." className="mt-1 min-h-[100px]" data-testid="input-scope" />
              </div>
              <div>
                <Label htmlFor="purpose">Finalidade e Benefícios</Label>
                <Textarea id="purpose" value={formData.purpose} onChange={(e) => updateForm('purpose', e.target.value)}
                  placeholder="Qual a finalidade do projeto e os benefícios esperados para a população?" className="mt-1 min-h-[100px]" data-testid="input-purpose" />
              </div>
            </div>
          )}

          {/* Step 3: Attachments */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base">Arquivos Complementares</Label>
                <p className="text-sm text-slate-500 mt-1 mb-4">
                  Anexe documentos que possam auxiliar na análise técnica (levantamentos, plantas, fotos, etc.).
                  A inexistência de anexos não impede o envio da solicitação.
                </p>
                
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-teal-300 transition-colors">
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 mb-2">Arraste arquivos ou clique para selecionar</p>
                  <p className="text-xs text-slate-400 mb-4">PDF, DOC, DOCX, XLS, XLSX, DWG, DXF, JPG, PNG, TXT</p>
                  <Button variant="outline" onClick={handleAddAttachment} data-testid="btn-add-attachment">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Adicionar Arquivo
                  </Button>
                </div>
              </div>

              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label>Arquivos Anexados ({formData.attachments.length})</Label>
                  {formData.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{attachment.filename}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(attachment.file_size)} • {attachment.file_type.toUpperCase()}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveAttachment(attachment.id)}>
                        <X className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  <strong>Documentos usualmente necessários:</strong><br />
                  {formData.project_type === 'pavimentacao' && 'Levantamento topográfico, Matrícula do imóvel, Projeto geométrico, Memorial descritivo'}
                  {formData.project_type === 'edificacao' && 'Planta de situação, Projeto arquitetônico, Matrícula do terreno, Estudo de viabilidade'}
                  {formData.project_type === 'infraestrutura' && 'Levantamento planialtimétrico, Estudo hidrológico, Memorial técnico, ART/RRT'}
                  {!formData.project_type && 'Selecione o tipo de projeto na etapa 1 para ver os documentos recomendados'}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 4: Priority and Deadline */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <div>
                <Label className="text-base">Prioridade (Estrelas)</Label>
                <p className="text-sm text-slate-500 mb-3">
                  5 estrelas = Máxima prioridade (limite de 1 projeto simultâneo por área)
                </p>
                <div className="flex items-center gap-4">
                  <StarRating value={formData.priority} onChange={(value) => updateForm('priority', value)} size="xl" showLabel />
                </div>
              </div>

              <div>
                <Label className="text-base">Nível de Prazo Desejado</Label>
                <p className="text-sm text-slate-500 mb-3">
                  Indique sua expectativa de urgência. Este indicador é informativo e não vinculante.
                </p>
                <Select value={formData.desired_deadline} onValueChange={(value) => updateForm('desired_deadline', value)}>
                  <SelectTrigger className="w-full" data-testid="select-deadline">
                    <SelectValue placeholder="Selecione o nível de prazo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixo">Baixo (sem urgência)</SelectItem>
                    <SelectItem value="medio">Médio (prazo regular)</SelectItem>
                    <SelectItem value="alto">Alto (urgente)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base">Impacto Regional: {formData.impact_score}/10</Label>
                <p className="text-sm text-slate-500 mb-3">1 = Bairro isolado | 5 = Município | 10 = Intermunicipal</p>
                <Slider value={[formData.impact_score]} onValueChange={([value]) => updateForm('impact_score', value)} min={1} max={10} step={1} className="mt-2" />
              </div>

              <div>
                <Label className="text-base">Urgência: {formData.urgency_score}/10</Label>
                <p className="text-sm text-slate-500 mb-3">1 = Recurso próprio | 5 = Convênio | 10 = Edital com prazo</p>
                <Slider value={[formData.urgency_score]} onValueChange={([value]) => updateForm('urgency_score', value)} min={1} max={10} step={1} className="mt-2" />
              </div>
            </div>
          )}

          {/* Step 5: AI Analysis */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <Alert className="bg-teal-50 border-teal-200">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <AlertTitle className="text-teal-800">Análise Orientativa de IA</AlertTitle>
                <AlertDescription className="text-teal-700">
                  A IA realiza análise <strong>exclusivamente consultiva e educativa</strong>, sem poder decisório.
                  Esta análise visa orientar sobre a qualidade das informações fornecidas.
                </AlertDescription>
              </Alert>

              {analyzing ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
                  <p className="text-slate-600">Analisando informações...</p>
                  <p className="text-sm text-slate-400">A IA está avaliando a suficiência dos dados</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-6">
                  {/* Sufficiency */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileCheck className="w-5 h-5" />
                        Suficiência das Informações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge className={`text-sm px-4 py-1 ${sufficiencyColors[aiAnalysis.information_sufficiency] || 'bg-slate-100'}`}>
                        {sufficiencyLabels[aiAnalysis.information_sufficiency] || aiAnalysis.information_sufficiency}
                      </Badge>
                      
                      {aiAnalysis.missing_documents?.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-slate-700 mb-2">Documentos usualmente necessários não identificados:</p>
                          <ul className="space-y-1">
                            {aiAnalysis.missing_documents.map((doc, i) => (
                              <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                {doc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Complexity and Deadline */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Complexidade Estimada</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge className={`text-sm px-4 py-1 ${
                          aiAnalysis.estimated_complexity === 'minima' ? 'bg-green-100 text-green-700' :
                          aiAnalysis.estimated_complexity === 'media' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {aiAnalysis.estimated_complexity === 'minima' ? 'Mínima' :
                           aiAnalysis.estimated_complexity === 'media' ? 'Média' : 'Alta'}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Compatibilidade de Prazo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge className={`text-sm px-4 py-1 ${compatibilityColors[aiAnalysis.deadline_compatibility] || 'bg-slate-100'}`}>
                          {aiAnalysis.deadline_compatibility === 'compativel' ? 'Compatível' :
                           aiAnalysis.deadline_compatibility === 'parcialmente_compativel' ? 'Parcialmente Compatível' :
                           aiAnalysis.deadline_compatibility === 'incompativel' ? 'Incompatível' : 'Indefinido'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Suggested Deadline */}
                  {aiAnalysis.suggested_deadline_days && (
                    <Card className="bg-slate-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <Clock className="w-8 h-8 text-slate-500" />
                          <div>
                            <p className="text-sm text-slate-500">Prazo Estimado Referencial</p>
                            <p className="text-2xl font-bold text-slate-900">{aiAnalysis.suggested_deadline_days} dias</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Technical Explanation */}
                  {aiAnalysis.technical_explanation && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Explicação Técnica</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600">{aiAnalysis.technical_explanation}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendations */}
                  {aiAnalysis.recommendations?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Recomendações</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {aiAnalysis.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 text-xs mt-0.5">{i + 1}</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Disclaimer */}
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 text-xs">
                      <strong>IMPORTANTE:</strong> Esta análise possui caráter MERAMENTE REFERENCIAL e ORIENTATIVO. 
                      Não constitui aprovação, compromisso ou definição oficial. A solicitação será validada por responsável técnico humano.
                    </AlertDescription>
                  </Alert>

                  <Button variant="outline" onClick={runAIAnalysis} className="w-full">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Refazer Análise
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Análise de IA não disponível</p>
                  <Button variant="outline" onClick={runAIAnalysis} className="mt-4">
                    Executar Análise
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Confirmation */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Resumo da Solicitação</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Título</p>
                    <p className="font-medium">{formData.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Tipo</p>
                    <p className="font-medium">
                      {formData.project_type === 'pavimentacao' ? 'Pavimentação' :
                       formData.project_type === 'edificacao' ? 'Edificação' : 'Infraestrutura'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Município</p>
                    <p className="font-medium">{selectedMunicipality?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Prioridade</p>
                    <StarRating value={formData.priority} readonly size="sm" showLabel />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Prazo Desejado</p>
                    <p className="font-medium">{deadlineLabels[formData.desired_deadline]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Anexos</p>
                    <p className="font-medium">{formData.attachments.length} arquivo(s)</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-slate-500">Descrição</p>
                  <p className="text-slate-700">{formData.description}</p>
                </div>

                {aiAnalysis && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-500 mb-2">Análise IA (Orientativa)</p>
                    <div className="flex gap-2">
                      <Badge className={sufficiencyColors[aiAnalysis.information_sufficiency] || 'bg-slate-100'}>
                        Info: {sufficiencyLabels[aiAnalysis.information_sufficiency]}
                      </Badge>
                      <Badge className={aiAnalysis.estimated_complexity === 'alta' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                        Complexidade: {aiAnalysis.estimated_complexity}
                      </Badge>
                      {aiAnalysis.suggested_deadline_days && (
                        <Badge variant="outline">~{aiAnalysis.suggested_deadline_days} dias</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Info className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Ao confirmar, sua solicitação será registrada e passará pela análise técnica da equipe AMVALI.
                  O prazo e priorização serão definidos pelo responsável técnico humano.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1} data-testid="btn-back">
              <ArrowLeft className="w-4 h-4 mr-2" />Voltar
            </Button>

            {currentStep < steps.length ? (
              <Button onClick={handleNext} disabled={!isStepValid() || analyzing} className="bg-teal-600 hover:bg-teal-700" data-testid="btn-next">
                {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analisando...</> : <>Próximo<ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="bg-teal-600 hover:bg-teal-700" data-testid="btn-submit">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Confirmar Solicitação</>}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default NewProjectPage;
