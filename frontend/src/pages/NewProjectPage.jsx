import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight,
  Loader2,
  MapPin,
  FileText,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import StarRating from '../components/custom/StarRating';
import { useAuth } from '../contexts/AuthContext';
import { createProject, getMunicipalities } from '../services/api';
import { toast } from 'sonner';

const steps = [
  { id: 1, title: 'Informações Básicas', icon: FileText },
  { id: 2, title: 'Localização e Escopo', icon: MapPin },
  { id: 3, title: 'Prioridade e Impacto', icon: BarChart3 },
  { id: 4, title: 'Confirmação', icon: CheckCircle2 },
];

const NewProjectPage = () => {
  const navigate = useNavigate();
  const { user, isMunicipal } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [municipalities, setMunicipalities] = useState([]);
  
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
    cost_score: 5
  });

  useEffect(() => {
    loadMunicipalities();
  }, []);

  const loadMunicipalities = async () => {
    try {
      const response = await getMunicipalities();
      setMunicipalities(response.data);
      
      // Set default municipality for municipal users
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

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.description && formData.project_type && formData.municipality_id;
      case 2:
        return true; // Optional fields
      case 3:
        return formData.priority > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await createProject(formData);
      toast.success('Solicitação criada com sucesso!');
      navigate(`/projects/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const selectedMunicipality = municipalities.find(m => m.id === formData.municipality_id);

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in" data-testid="new-project-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/projects')}
          data-testid="back-button"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova Solicitação</h1>
          <p className="text-slate-500">Preencha os dados do projeto</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  currentStep >= step.id 
                    ? 'border-teal-500 bg-teal-500 text-white' 
                    : 'border-slate-300 bg-white text-slate-400'
                }`}
              >
                <step.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs mt-2 ${
                currentStep >= step.id ? 'text-teal-600 font-medium' : 'text-slate-400'
              }`}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${
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
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  placeholder="Ex: Pavimentação da Rua das Flores"
                  className="mt-1"
                  data-testid="input-title"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="Descreva o projeto em detalhes..."
                  className="mt-1 min-h-[120px]"
                  data-testid="input-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Projeto *</Label>
                  <Select 
                    value={formData.project_type} 
                    onValueChange={(value) => updateForm('project_type', value)}
                  >
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
                  <Select 
                    value={formData.municipality_id} 
                    onValueChange={(value) => updateForm('municipality_id', value)}
                    disabled={isMunicipal}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-municipality">
                      <SelectValue placeholder="Selecione o município" />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalities.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
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
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => updateForm('location', e.target.value)}
                  placeholder="Ex: Bairro Centro, próximo à praça principal"
                  className="mt-1"
                  data-testid="input-location"
                />
              </div>

              <div>
                <Label htmlFor="scope">Escopo do Projeto</Label>
                <Textarea
                  id="scope"
                  value={formData.scope}
                  onChange={(e) => updateForm('scope', e.target.value)}
                  placeholder="Detalhe o escopo técnico do projeto..."
                  className="mt-1 min-h-[100px]"
                  data-testid="input-scope"
                />
              </div>

              <div>
                <Label htmlFor="purpose">Finalidade</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => updateForm('purpose', e.target.value)}
                  placeholder="Qual a finalidade e benefícios esperados?"
                  className="mt-1 min-h-[100px]"
                  data-testid="input-purpose"
                />
              </div>
            </div>
          )}

          {/* Step 3: Priority and Impact */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div>
                <Label className="text-base">Prioridade (Estrelas)</Label>
                <p className="text-sm text-slate-500 mb-3">
                  5 estrelas = Máxima prioridade (limite de 1 projeto simultâneo)
                </p>
                <div className="flex items-center gap-4">
                  <StarRating 
                    value={formData.priority} 
                    onChange={(value) => updateForm('priority', value)}
                    size="xl"
                    showLabel
                  />
                </div>
              </div>

              <div>
                <Label className="text-base">Impacto Regional: {formData.impact_score}/10</Label>
                <p className="text-sm text-slate-500 mb-3">
                  1 = Bairro isolado | 5 = Município inteiro | 10 = Intermunicipal
                </p>
                <Slider
                  value={[formData.impact_score]}
                  onValueChange={([value]) => updateForm('impact_score', value)}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                  data-testid="slider-impact"
                />
              </div>

              <div>
                <Label className="text-base">Urgência: {formData.urgency_score}/10</Label>
                <p className="text-sm text-slate-500 mb-3">
                  1 = Recurso próprio | 5 = Convênio estadual | 10 = Edital federal com prazo
                </p>
                <Slider
                  value={[formData.urgency_score]}
                  onValueChange={([value]) => updateForm('urgency_score', value)}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                  data-testid="slider-urgency"
                />
              </div>

              <div>
                <Label className="text-base">Investimento/Custo: {formData.cost_score}/10</Label>
                <p className="text-sm text-slate-500 mb-3">
                  1 = Baixo investimento | 5 = Médio | 10 = Alto investimento
                </p>
                <Slider
                  value={[formData.cost_score]}
                  onValueChange={([value]) => updateForm('cost_score', value)}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                  data-testid="slider-cost"
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
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
                      {formData.project_type === 'pavimentacao' && 'Pavimentação'}
                      {formData.project_type === 'edificacao' && 'Edificação'}
                      {formData.project_type === 'infraestrutura' && 'Infraestrutura'}
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
                </div>

                <div className="mt-4">
                  <p className="text-sm text-slate-500">Descrição</p>
                  <p className="text-slate-700">{formData.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200">
                  <div>
                    <p className="text-sm text-slate-500">Impacto</p>
                    <p className="font-medium">{formData.impact_score}/10</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Urgência</p>
                    <p className="font-medium">{formData.urgency_score}/10</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Investimento</p>
                    <p className="font-medium">{formData.cost_score}/10</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Importante:</strong> Ao confirmar, sua solicitação será registrada e 
                  passará pela análise de viabilidade e capacidade técnica da AMVALI.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              data-testid="btn-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            {currentStep < steps.length ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="bg-teal-600 hover:bg-teal-700"
                data-testid="btn-next"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700"
                data-testid="btn-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirmar Solicitação
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewProjectPage;
