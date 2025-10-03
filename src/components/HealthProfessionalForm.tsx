import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import cactoLogo from "@/assets/logo-cactoai.png";

interface Professional {
  id: string;
  professionalName: string;
  profession: string;
  registrationNumber: string;
  registrationState: string;
}

interface Procedure {
  id: string;
  name: string;
  price: string;
  duration: string;
  description: string;
}

interface WorkingHours {
  [key: string]: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface FormData {
  businessName: string;
  phone: string;
  cep: string;
  city: string;
  state: string;
  street: string;
  neighborhood: string;
  number: string;
  complement: string;
}

const WEBHOOK_URL = "https://flow.cactoai.com/webhook/cadastro-clinica";

const PROFESSIONS = [
  { value: "medico", label: "Médico", registration: "CRM" },
  { value: "dentista", label: "Dentista", registration: "CRO" },
  { value: "nutricionista", label: "Nutricionista", registration: "CRN" },
  { value: "psicologo", label: "Psicólogo", registration: "CRP" },
  { value: "fisioterapeuta", label: "Fisioterapeuta", registration: "CREFITO" },
  { value: "fonoaudiologo", label: "Fonoaudiólogo", registration: "CRFa" },
  { value: "terapeuta-ocupacional", label: "Terapeuta Ocupacional", registration: "CREFITO" },
];

const BRAZILIAN_STATES = [
  { value: "AC", label: "AC - Acre" },
  { value: "AL", label: "AL - Alagoas" },
  { value: "AP", label: "AP - Amapá" },
  { value: "AM", label: "AM - Amazonas" },
  { value: "BA", label: "BA - Bahia" },
  { value: "CE", label: "CE - Ceará" },
  { value: "DF", label: "DF - Distrito Federal" },
  { value: "ES", label: "ES - Espírito Santo" },
  { value: "GO", label: "GO - Goiás" },
  { value: "MA", label: "MA - Maranhão" },
  { value: "MT", label: "MT - Mato Grosso" },
  { value: "MS", label: "MS - Mato Grosso do Sul" },
  { value: "MG", label: "MG - Minas Gerais" },
  { value: "PA", label: "PA - Pará" },
  { value: "PB", label: "PB - Paraíba" },
  { value: "PR", label: "PR - Paraná" },
  { value: "PE", label: "PE - Pernambuco" },
  { value: "PI", label: "PI - Piauí" },
  { value: "RJ", label: "RJ - Rio de Janeiro" },
  { value: "RN", label: "RN - Rio Grande do Norte" },
  { value: "RS", label: "RS - Rio Grande do Sul" },
  { value: "RO", label: "RO - Rondônia" },
  { value: "RR", label: "RR - Roraima" },
  { value: "SC", label: "SC - Santa Catarina" },
  { value: "SP", label: "SP - São Paulo" },
  { value: "SE", label: "SE - Sergipe" },
  { value: "TO", label: "TO - Tocantins" },
];

const generateSlug = (input: string): string => {
  if (!input) return "";
  const withoutAccents = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return withoutAccents.trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
};

export const HealthProfessionalForm = () => {
  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    phone: "",
    cep: "",
    city: "",
    state: "",
    street: "",
    neighborhood: "",
    number: "",
    complement: "",
  });

  const [professionals, setProfessionals] = useState<Professional[]>([
    { id: "1", professionalName: "", profession: "", registrationNumber: "", registrationState: "" }
  ]);

  const [procedures, setProcedures] = useState<Procedure[]>([
    { id: "1", name: "", price: "", duration: "", description: "" }
  ]);

  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    segunda: { enabled: false, start: "", end: "" },
    terca: { enabled: false, start: "", end: "" },
    quarta: { enabled: false, start: "", end: "" },
    quinta: { enabled: false, start: "", end: "" },
    sexta: { enabled: false, start: "", end: "" },
    sabado: { enabled: false, start: "", end: "" },
    domingo: { enabled: false, start: "", end: "" },
  });

  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug when business name changes
    if (field === "businessName") {
      setSlug(generateSlug(value));
    }
  };

  const fetchAddressByCEP = async (cep: string) => {
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            city: data.localidade || "",
            state: data.uf || "",
            street: data.logradouro || "",
            neighborhood: data.bairro || "",
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const maskedCEP = value.replace(/(\d{5})(\d{3})/, "$1-$2");
    setFormData(prev => ({ ...prev, cep: maskedCEP }));
    
    if (value.length === 8) {
      fetchAddressByCEP(value);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    let maskedPhone = value;
    
    if (value.length <= 10) {
      maskedPhone = value.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    } else {
      maskedPhone = value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    
    setFormData(prev => ({ ...prev, phone: maskedPhone }));
  };

  const handleStateChange = (value: string) => {
    setFormData(prev => ({ ...prev, state: value }));
  };

  // Professional management functions
  const addProfessional = () => {
    const newProfessional: Professional = {
      id: Date.now().toString(),
      professionalName: "",
      profession: "",
      registrationNumber: "",
      registrationState: "",
    };
    setProfessionals(prev => [...prev, newProfessional]);
  };

  const removeProfessional = (id: string) => {
    setProfessionals(prev => prev.filter(prof => prof.id !== id));
  };

  const updateProfessional = (id: string, field: keyof Omit<Professional, 'id'>, value: string) => {
    setProfessionals(prev => prev.map(prof => 
      prof.id === id ? { ...prof, [field]: value } : prof
    ));
  };

  const handleRegistrationNumberChange = (id: string, value: string) => {
    const numericValue = value.replace(/\D/g, "");
    
    // Validação: número de registro deve ter entre 4 e 10 dígitos
    if (numericValue.length <= 10) {
      updateProfessional(id, 'registrationNumber', numericValue);
    }
  };

  const validateRegistrationNumber = (registrationNumber: string): boolean => {
    return registrationNumber.length >= 4 && registrationNumber.length <= 10;
  };

  // Procedure management functions
  const addProcedure = () => {
    const newProcedure: Procedure = {
      id: Date.now().toString(),
      name: "",
      price: "",
      duration: "",
      description: "",
    };
    setProcedures(prev => [...prev, newProcedure]);
  };

  const removeProcedure = (id: string) => {
    setProcedures(prev => prev.filter(proc => proc.id !== id));
  };

  const updateProcedure = (id: string, field: keyof Omit<Procedure, 'id'>, value: string) => {
    setProcedures(prev => prev.map(proc => 
      proc.id === id ? { ...proc, [field]: value } : proc
    ));
  };

  const updateWorkingHours = (day: string, field: 'enabled' | 'start' | 'end', value: boolean | string) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar números de registro
    const invalidRegistrations = professionals.filter(prof => 
      prof.professionalName.trim() !== "" && !validateRegistrationNumber(prof.registrationNumber)
    );
    
    if (invalidRegistrations.length > 0) {
      toast({
        title: "Erro de validação",
        description: "Número de registro deve ter entre 4 e 10 dígitos.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    const payload = {
      ...formData,
      slug,
      professionals: professionals.filter(prof => prof.professionalName.trim() !== ""),
      procedures: procedures.filter(proc => proc.name.trim() !== ""),
      workingHours: Object.fromEntries(
        Object.entries(workingHours).filter(([_, hours]) => hours.enabled)
      ),
      timestamp: new Date().toISOString(),
      triggered_from: window.location.origin,
    };

    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: "no-cors",
        body: JSON.stringify(payload),
      });

      toast({
        title: "Cadastro enviado com sucesso!",
        description: "Os dados foram enviados para processamento.",
      });

      // Reset form
      setFormData({
        businessName: "",
        phone: "",
        cep: "",
        city: "",
        state: "",
        street: "",
        neighborhood: "",
        number: "",
        complement: "",
      });
      
      setProfessionals([{ id: "1", professionalName: "", profession: "", registrationNumber: "", registrationState: "" }]);
      setProcedures([{ id: "1", name: "", price: "", duration: "", description: "" }]);
      setWorkingHours({
        segunda: { enabled: false, start: "", end: "" },
        terca: { enabled: false, start: "", end: "" },
        quarta: { enabled: false, start: "", end: "" },
        quinta: { enabled: false, start: "", end: "" },
        sexta: { enabled: false, start: "", end: "" },
        sabado: { enabled: false, start: "", end: "" },
        domingo: { enabled: false, start: "", end: "" },
      });
      setSlug("");

    } catch (error) {
      console.error("Error sending data:", error);
      toast({
        title: "Erro ao enviar dados",
        description: "Falha ao enviar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <img 
            src={cactoLogo} 
            alt="CactoAI" 
            className="h-12 mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Cadastro de Profissional de Saúde
          </h1>
          <p className="text-muted-foreground">
            Cadastre seu consultório ou clínica na plataforma CactoAI
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Informações do Estabelecimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName">Nome do consultório/clínica *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange("businessName")}
                  placeholder="Ex.: Clínica Saúde Total"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Dados do Profissional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {professionals.map((professional, index) => {
                const selectedProfession = PROFESSIONS.find(p => p.value === professional.profession);
                
                return (
                  <div key={professional.id} className="grid grid-cols-1 gap-4 p-4 border border-border rounded-lg">
                    <div>
                      <Label>Nome do profissional *</Label>
                      <Input
                        value={professional.professionalName}
                        onChange={(e) => updateProfessional(professional.id, 'professionalName', e.target.value)}
                        placeholder="Ex.: Dr. João Silva"
                        required
                      />
                    </div>

                    <div>
                      <Label>Profissão *</Label>
                      <Select 
                        value={professional.profession} 
                        onValueChange={(value) => updateProfessional(professional.id, 'profession', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione sua profissão" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROFESSIONS.map((profession) => (
                            <SelectItem key={profession.value} value={profession.value}>
                              {profession.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>
                          Número do {selectedProfession?.registration || "Registro"} *
                        </Label>
                        <Input
                          value={professional.registrationNumber}
                          onChange={(e) => handleRegistrationNumberChange(professional.id, e.target.value)}
                          placeholder="Ex.: 123456"
                          maxLength={10}
                          required
                          className={
                            professional.registrationNumber && 
                            !validateRegistrationNumber(professional.registrationNumber)
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {professional.registrationNumber && 
                         !validateRegistrationNumber(professional.registrationNumber) && (
                          <p className="text-sm text-destructive mt-1">
                            Deve ter entre 4 e 10 dígitos
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Estado do registro *</Label>
                        <Select 
                          value={professional.registrationState} 
                          onValueChange={(value) => updateProfessional(professional.id, 'registrationState', value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {BRAZILIAN_STATES.map((state) => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {professionals.length > 1 && (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeProfessional(professional.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover Profissional
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
              
              <Button
                type="button"
                variant="outline"
                onClick={addProfessional}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Profissional
              </Button>
            </CardContent>
          </Card>

          {/* Contact and Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Contato e Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 98888-7777"
                  maxLength={15}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={handleCEPChange}
                    placeholder="01001-000"
                    maxLength={8}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={handleInputChange("city")}
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Select value={formData.state} onValueChange={handleStateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={handleInputChange("street")}
                    placeholder="Logradouro"
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={handleInputChange("number")}
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleInputChange("neighborhood")}
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.complement}
                    onChange={handleInputChange("complement")}
                    placeholder="Sala, andar, etc."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Horários de Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(workingHours).map(([day, hours]) => (
                <div key={day} className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 py-2">
                  <div className="flex items-center space-x-2 min-w-[120px] md:min-w-[140px]">
                    <Checkbox 
                      id={`checkbox-${day}`}
                      checked={hours.enabled}
                      onCheckedChange={(checked) => updateWorkingHours(day, 'enabled', !!checked)}
                    />
                    <Label 
                      htmlFor={`checkbox-${day}`}
                      className="capitalize whitespace-nowrap cursor-pointer select-none"
                    >
                      {day === 'terca' ? 'Terça' : day === 'quarta' ? 'Quarta' : day === 'quinta' ? 'Quinta' : day === 'sexta' ? 'Sexta' : day === 'sabado' ? 'Sábado' : day}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 w-full md:flex-1">
                    <Select value={hours.start} onValueChange={(value) => updateWorkingHours(day, 'start', value)}>
                      <SelectTrigger className="w-full md:w-[120px] lg:w-[140px]" disabled={!hours.enabled}>
                        <SelectValue placeholder="Início" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0') + ':00';
                          return (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground whitespace-nowrap text-sm px-1">às</span>
                    <Select value={hours.end} onValueChange={(value) => updateWorkingHours(day, 'end', value)}>
                      <SelectTrigger className="w-full md:w-[120px] lg:w-[140px]" disabled={!hours.enabled}>
                        <SelectValue placeholder="Fim" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0') + ':00';
                          return (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Procedures */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Procedimentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {procedures.map((procedure) => (
                <div key={procedure.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border rounded-lg">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={procedure.name}
                      onChange={(e) => updateProcedure(procedure.id, 'name', e.target.value)}
                      placeholder="Ex.: Limpeza"
                    />
                  </div>
                  <div>
                    <Label>Preço (R$)</Label>
                    <Input
                      value={procedure.price}
                      onChange={(e) => updateProcedure(procedure.id, 'price', e.target.value)}
                      placeholder="Ex.: 150.00"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label>Duração (min)</Label>
                    <Input
                      value={procedure.duration}
                      onChange={(e) => updateProcedure(procedure.id, 'duration', e.target.value)}
                      placeholder="Ex.: 45"
                      type="number"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label>Descrição</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={procedure.description}
                        onChange={(e) => updateProcedure(procedure.id, 'description', e.target.value)}
                        placeholder="Breve descrição"
                      />
                      {procedures.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeProcedure(procedure.id)}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addProcedure}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Procedimento
              </Button>
            </CardContent>
          </Card>

          {/* Publication Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Configurações de Publicação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="slug">Slug (gerado automaticamente)</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="slug-gerado-automaticamente"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  minúsculo, sem acentos, espaços viram "_"
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button 
              type="submit" 
              size="lg" 
              disabled={isSubmitting}
              className="px-8 py-3 text-lg"
            >
              {isSubmitting ? "Enviando..." : "Cadastrar Profissional"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
