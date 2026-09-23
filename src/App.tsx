import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = 'painel' | 'chat' | 'instrumentos' | 'checklist' | 'quiz' | 'etapas';

interface Message {
  role: 'bot' | 'user';
  text: string;
  time: string;
}

interface CheckItem {
  id: number;
  label: string;
  category: string;
  checked: boolean;
}

interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Step {
  title: string;
  desc: string;
  duration: string;
  status: 'pending' | 'active' | 'done';
}

// ─── Data ────────────────────────────────────────────────────────────────────
const CHECKLIST_ITEMS: CheckItem[] = [
  { id: 1, label: 'Bisturi nº 22', category: 'Instrumental de corte', checked: false },
  { id: 2, label: 'Tesoura de Metzenbaum', category: 'Instrumental de corte', checked: false },
  { id: 3, label: 'Pinça hemostática Kelly', category: 'Instrumental de apreensão', checked: false },
  { id: 4, label: 'Pinça de Allis', category: 'Instrumental de apreensão', checked: false },
  { id: 5, label: 'Afastador de Farabeuf', category: 'Afastadores', checked: false },
  { id: 6, label: 'Afastador de Richardson', category: 'Afastadores', checked: false },
  { id: 7, label: 'Porta-agulha de Mathieu', category: 'Sutura', checked: false },
  { id: 8, label: 'Fio de sutura PDS 3-0', category: 'Sutura', checked: false },
  { id: 9, label: 'Gazes estéreis (20 unid.)', category: 'Materiais', checked: false },
  { id: 10, label: 'Campo cirúrgico estéril', category: 'Materiais', checked: false },
  { id: 11, label: 'Electrocautério bipolar', category: 'Eletrocirurgia', checked: false },
  { id: 12, label: 'Aspirador cirúrgico', category: 'Eletrocirurgia', checked: false },
  { id: 13, label: 'Grampeador linear cortante', category: 'Grampeadores', checked: false },
  { id: 14, label: 'Grampeador circular 25mm', category: 'Grampeadores', checked: false },
  { id: 15, label: 'Trocáter 5mm (×3)', category: 'Laparoscopia', checked: false },
  { id: 16, label: 'Trocáter 12mm (×2)', category: 'Laparoscopia', checked: false },
  { id: 17, label: 'Câmera laparoscópica 4K', category: 'Laparoscopia', checked: false },
  { id: 18, label: 'Insuflador CO₂', category: 'Laparoscopia', checked: false },
];

const QUIZ: QuizQuestion[] = [
  {
    q: 'Qual é o IMC mínimo recomendado pelo CFM para indicação cirúrgica bariátrica sem comorbidades?',
    options: ['35 kg/m²', '40 kg/m²', '45 kg/m²', '30 kg/m²'],
    correct: 1,
    explanation: 'O CFM recomenda IMC ≥ 40 kg/m² sem comorbidades, ou ≥ 35 kg/m² com comorbidades graves.',
  },
  {
    q: 'Na cirurgia de bypass gástrico em Y-de-Roux, qual é o volume aproximado do pouch gástrico?',
    options: ['50–100 ml', '15–30 ml', '150–200 ml', '5–10 ml'],
    correct: 1,
    explanation: 'O pouch gástrico no bypass tem volume de 15 a 30 ml para limitar a ingestão alimentar.',
  },
  {
    q: 'Qual complicação pós-operatória imediata é mais grave nas primeiras 48h após bypass gástrico?',
    options: ['Náusea leve', 'Fístula anastomótica', 'Constipação', 'Refluxo'],
    correct: 1,
    explanation: 'A fístula anastomótica é a complicação mais grave e pode ser fatal se não tratada rapidamente.',
  },
  {
    q: 'Qual técnica bariátrica é considerada puramente restritiva, sem componente disabsortivo?',
    options: ['Bypass gástrico (RYGB)', 'Sleeve gástrico', 'Derivação biliopancreática', 'Duodenal switch'],
    correct: 1,
    explanation: 'O sleeve gástrico (gastrectomia vertical) é uma técnica puramente restritiva que remove ~80% do estômago.',
  },
  {
    q: 'Qual é a pressão de insuflação de CO₂ recomendada no pneumoperitônio para cirurgia bariátrica laparoscópica?',
    options: ['5–8 mmHg', '12–15 mmHg', '20–25 mmHg', '30 mmHg'],
    correct: 1,
    explanation: 'A pressão padrão de insuflação é 12–15 mmHg, garantindo visibilidade sem comprometer a ventilação.',
  },
];

const STEPS: Step[] = [
  { title: 'Posicionamento e preparo', desc: 'Paciente em decúbito dorsal, Trendelenburg reverso 30°. Antissepsia com PVPI. Instalação de campos cirúrgicos estéreis.', duration: '15 min', status: 'active' },
  { title: 'Acesso laparoscópico', desc: 'Inserção de trocáter óptico 12mm na região umbilical. Criação do pneumoperitônio com CO₂ a 15 mmHg. Posicionamento dos demais trocáteres.', duration: '20 min', status: 'pending' },
  { title: 'Confecção do pouch gástrico', desc: 'Secção do estômago com grampeador linear cortante. Criação do pouch de 15–30 ml. Hemostasia por eletrocauterização.', duration: '45 min', status: 'pending' },
  { title: 'Anastomose gastrojejunal', desc: 'Confecção da anastomose em Y-de-Roux. Alça alimentar de 150 cm. Teste de estanqueidade com azul de metileno.', duration: '60 min', status: 'pending' },
  { title: 'Fechamento e curativo', desc: 'Revisão da hemostasia. Retirada dos trocáteres sob visão direta. Sutura da aponeurose. Curativo compressivo estéril.', duration: '20 min', status: 'pending' },
];

const BOT_RESPONSES: Record<string, string> = {
  default: 'Olá! Sou o CIRURBOT, seu assistente de simulação cirúrgica. Posso ajudar com informações sobre o procedimento, instrumentais, checklist ou etapas da cirurgia bariátrica.',
  ola: 'Olá, cirurgião! Estou pronto para apoiar sua simulação. Qual aspecto do procedimento deseja explorar?',
  bypass: 'O bypass gástrico em Y-de-Roux é o padrão ouro da cirurgia bariátrica. Combina restrição (pouch de 15–30 ml) com má absorção leve. Taxa de remissão de diabetes tipo 2: até 80%.',
  sleeve: 'O sleeve gástrico remove aproximadamente 80% do estômago, criando um tubo gástrico. É uma técnica restritiva pura, sem anastomose intestinal, com menor risco cirúrgico.',
  instrumentos: 'Para cirurgia bariátrica laparoscópica são essenciais: trocáteres 5mm e 12mm, grampeadores lineares cortantes, câmera 4K, insuflador CO₂ e pinças laparoscópicas de trabalho.',
  anestesia: 'A cirurgia bariátrica requer anestesia geral com intubação. Atenção especial ao posicionamento, ventilação protetora e ajuste de doses por peso ideal, não peso real.',
  complicacoes: 'Complicações precoces incluem: fístula anastomótica (0,5–2%), hemorragia, TVP e infecção. Monitorar febre, taquicardia e dor abdominal no pós-operatório imediato.',
  checklist: 'O checklist de segurança cirúrgica (WHO Surgical Safety Checklist) é obrigatório. Confirme: identidade do paciente, lateralidade, alergias, esterilidade dos campos e instrumentais.',
  passos: 'As 5 etapas principais são: 1. Posicionamento; 2. Acesso laparoscópico; 3. Confecção do pouch; 4. Anastomose gastrojejunal; 5. Fechamento. Devo detalhar alguma delas?',
};

// ─── Utilities ───────────────────────────────────────────────────────────────
function getBotResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const key of Object.keys(BOT_RESPONSES)) {
    if (key !== 'default' && lower.includes(key)) return BOT_RESPONSES[key];
  }
  return BOT_RESPONSES.default;
}

function now() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'pt-BR';
  utter.rate = 0.95;
  utter.pitch = 0.85;
  window.speechSynthesis.speak(utter);
}

// ─── Components ──────────────────────────────────────────────────────────────

function BotAvatar({ size = 'md', float = false }: { size?: 'sm' | 'md' | 'lg'; float?: boolean }) {
  const sz = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-24 h-24' : 'w-14 h-14';
  const font = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-4xl' : 'text-2xl';
  return (
    <div className={`${sz} rounded-full flex items-center justify-center relative ${float ? 'bot-float' : ''}`}
      style={{ background: 'radial-gradient(circle at 35% 35%, #00d4ff33, #020b18)', border: '1.5px solid rgba(0,212,255,0.5)', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}>
      <span className={font}>🤖</span>
    </div>
  );
}

function StatusBadge({ label, value, color = 'cyan' }: { label: string; value: string; color?: 'cyan' | 'green' | 'amber' }) {
  const colors = {
    cyan: 'border-cyan-500/30 text-cyan-300',
    green: 'border-emerald-500/30 text-emerald-300',
    amber: 'border-amber-500/30 text-amber-300',
  };
  return (
    <div className={`px-3 py-2 rounded border font-mono text-xs ${colors[color]}`} style={{ background: 'rgba(0,10,25,0.6)' }}>
      <div className="text-[0.6rem] opacity-50 font-display uppercase tracking-widest mb-0.5">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

// ─── Panels ──────────────────────────────────────────────────────────────────

function PainelTab({ steps, checklist, quizScore, quizTotal, onNav }: {
  steps: Step[];
  checklist: CheckItem[];
  quizScore: number;
  quizTotal: number;
  onNav: (t: Tab) => void;
}) {
  const doneSteps = steps.filter(s => s.status === 'done').length;
  const checkedPct = Math.round((checklist.filter(c => c.checked).length / checklist.length) * 100);
  const activeStep = steps.find(s => s.status === 'active');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="panel-glass rounded-xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative flex items-center gap-5">
          <BotAvatar size="lg" float />
          <div>
            <div className="font-display text-2xl font-bold text-glow-cyan" style={{ color: '#00d4ff' }}>CIRURBOT</div>
            <div className="font-mono text-xs text-cyan-400/70 mt-0.5">Assistente de apoio à simulação cirúrgica</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #00ffcc' }} />
              <span className="font-mono text-xs text-emerald-400">SISTEMA ONLINE — MODO DEMONSTRAÇÃO</span>
            </div>
          </div>
          <div className="ml-auto hidden sm:flex">
            <div className="radar-sweep" />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatusBadge label="Procedimento" value="Bariátrica" color="cyan" />
        <StatusBadge label="Etapa atual" value={`${doneSteps + 1} / ${steps.length}`} color="cyan" />
        <StatusBadge label="Checklist" value={`${checkedPct}%`} color={checkedPct === 100 ? 'green' : 'amber'} />
        <StatusBadge label="Quiz" value={`${quizScore} pts`} color="green" />
      </div>

      {/* Progress bars */}
      <div className="panel-glass rounded-xl p-5 space-y-4">
        <div className="font-display text-xs text-cyan-400/70 tracking-widest uppercase">Progresso geral</div>
        <div>
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-cyan-400">Checklist de materiais</span>
            <span className="text-cyan-300">{checkedPct}%</span>
          </div>
          <div className="h-2 rounded bg-cyan-950/60">
            <div className="progress-bar-glow" style={{ width: `${checkedPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-cyan-400">Etapas concluídas</span>
            <span className="text-cyan-300">{Math.round((doneSteps / steps.length) * 100)}%</span>
          </div>
          <div className="h-2 rounded bg-cyan-950/60">
            <div className="progress-bar-glow" style={{ width: `${Math.round((doneSteps / steps.length) * 100)}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-cyan-400">Pontuação do quiz</span>
            <span className="text-cyan-300">{Math.round((quizScore / (quizTotal * 10)) * 100)}%</span>
          </div>
          <div className="h-2 rounded bg-cyan-950/60">
            <div className="progress-bar-glow" style={{ width: `${Math.round((quizScore / (quizTotal * 10)) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Active step */}
      {activeStep && (
        <div className="panel-glass rounded-xl p-5 border border-cyan-500/25" style={{ boxShadow: '0 0 20px rgba(0,212,255,0.07)' }}>
          <div className="font-display text-xs text-cyan-400/70 tracking-widest uppercase mb-3">Etapa em andamento</div>
          <div className="text-cyan-200 font-semibold">{activeStep.title}</div>
          <div className="text-cyan-400/70 text-sm mt-1">{activeStep.desc}</div>
          <div className="font-mono text-xs text-emerald-400 mt-2">⏱ Duração estimada: {activeStep.duration}</div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {([['chat', '💬 Consultar robô'], ['checklist', '☑️ Ver checklist'], ['quiz', '❓ Iniciar quiz'], ['etapas', '▣ Ver etapas'], ['instrumentos', '⚕ Instrumentos']] as [Tab, string][]).map(([tab, label]) => (
          <button key={tab} className="btn-cyber py-3 text-left" onClick={() => onNav(tab)}>{label}</button>
        ))}
      </div>

      <p className="text-[0.68rem] text-cyan-900 leading-relaxed border-t border-cyan-900/40 pt-3 font-mono">
        ⚠ A simulação representa apoio tecnológico educacional. As ações exibidas não devem ser usadas como instruções para uma cirurgia real.
      </p>
    </div>
  );
}

function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: BOT_RESPONSES.default, time: now() },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', text: text.trim(), time: now() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const response = getBotResponse(text);
      setMessages(m => [...m, { role: 'bot', text: response, time: now() }]);
      setTyping(false);
      speak(response);
    }, 1200 + Math.random() * 600);
  }, []);

  const startVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'pt-BR';
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      sendMessage(transcript);
    };
    recognitionRef.current = rec;
    rec.start();
  }, [sendMessage]);

  const testVoice = () => speak('Olá! Eu sou o CIRURBOT, seu assistente de simulação cirúrgica. Sistema de voz ativo e operacional.');

  const suggestions = ['O que é bypass gástrico?', 'Quais os instrumentos?', 'Complicações pós-op', 'Passos da cirurgia'];

  return (
    <div className="flex flex-col h-full gap-3" style={{ minHeight: '60vh' }}>
      {/* Top bar */}
      <div className="panel-glass rounded-xl p-3 flex items-center gap-3">
        <BotAvatar size="sm" float />
        <div>
          <div className="font-display text-xs font-bold text-cyan-300">CIRURBOT AI</div>
          <div className="font-mono text-[0.6rem] text-emerald-400">● online</div>
        </div>
        <div className="ml-auto flex gap-2">
          {voiceSupported && (
            <button className={`btn-cyber px-3 py-2 text-[0.6rem] ${listening ? 'border-red-400/60 text-red-300' : ''}`} onClick={startVoice}>
              {listening ? '🔴 ouvindo...' : '🎙️ falar'}
            </button>
          )}
          <button className="btn-accent px-3 py-2 text-[0.6rem]" onClick={testVoice}>🔊 testar voz</button>
        </div>
      </div>

      {/* Voice indicator */}
      {listening && (
        <div className="panel-glass rounded-xl p-4 flex items-center justify-center gap-4">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="voice-ring" />
            <div className="voice-ring" />
            <div className="voice-ring" />
            <span className="text-xl relative z-10">🎙️</span>
          </div>
          <div>
            <div className="font-display text-xs text-cyan-300">Ouvindo...</div>
            <div className="font-mono text-[0.6rem] text-cyan-500">Fale sua pergunta em português</div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="panel-glass rounded-xl p-4 flex-1 overflow-y-auto space-y-3" style={{ maxHeight: '45vh' }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'items-start gap-2'}`}>
            {m.role === 'bot' && <BotAvatar size="sm" />}
            <div>
              <div className={m.role === 'bot' ? 'chat-bubble-bot' : 'chat-bubble-user'}>{m.text}</div>
              <div className="font-mono text-[0.58rem] text-cyan-800 mt-1 px-1">{m.time}</div>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex items-start gap-2">
            <BotAvatar size="sm" />
            <div className="chat-bubble-bot flex items-center gap-1.5 py-3">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="flex gap-2 flex-wrap">
        {suggestions.map(s => (
          <button key={s} className="text-[0.65rem] px-2.5 py-1.5 rounded border border-cyan-800/40 text-cyan-600 hover:text-cyan-300 hover:border-cyan-500/40 transition-all font-mono" onClick={() => sendMessage(s)}>{s}</button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="flex-1 px-4 py-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-cyan-200 text-sm placeholder-cyan-800 focus:outline-none focus:border-cyan-500/60 font-mono"
          placeholder="Digite sua pergunta..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
        />
        <button className="btn-cyber px-4" onClick={() => sendMessage(input)}>Enviar</button>
      </div>
    </div>
  );
}

function InstrumentosTab() {
  const grupos = [
    {
      cat: 'Instrumental de corte',
      icon: '🔪',
      items: [
        { nome: 'Bisturi nº 22', uso: 'Incisão de pele e tecido subcutâneo', material: 'Aço inox cirúrgico grau 440C' },
        { nome: 'Tesoura de Metzenbaum', uso: 'Dissecção romba de tecidos delicados', material: 'Aço inox com pontas curvas' },
        { nome: 'Tesoura de Mayo', uso: 'Corte de tecidos resistentes e fios', material: 'Aço inox rígido' },
      ],
    },
    {
      cat: 'Instrumental de apreensão',
      icon: '🩺',
      items: [
        { nome: 'Pinça hemostática Kelly', uso: 'Controle de sangramento, disseção', material: 'Aço inox ranhado transversalmente' },
        { nome: 'Pinça de Allis', uso: 'Apreensão de tecidos resistentes', material: 'Aço com dentes de retenção' },
        { nome: 'Pinça de Babcock', uso: 'Apreensão atraumática de vísceras', material: 'Aço inox com mordente fenestrado' },
      ],
    },
    {
      cat: 'Grampeadores',
      icon: '⚙️',
      items: [
        { nome: 'Grampeador linear cortante 60mm', uso: 'Secção e grampeamento do estômago', material: 'Aço inox com grampos de titânio' },
        { nome: 'Grampeador circular 25mm', uso: 'Anastomose gastrojejunal', material: 'Plástico médico + componentes metálicos' },
      ],
    },
    {
      cat: 'Laparoscopia',
      icon: '📷',
      items: [
        { nome: 'Câmera laparoscópica 4K', uso: 'Visualização intraoperatória HD', material: 'Sensor CMOS 4K, 30fps' },
        { nome: 'Insuflador CO₂ eletrônico', uso: 'Criação e manutenção do pneumoperitônio', material: 'Fluxo máx. 30 L/min, pressão 0–30 mmHg' },
        { nome: 'Trocáter 12mm', uso: 'Entrada para grampeadores e câmera', material: 'Plástico médico transparente' },
      ],
    },
  ];

  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="panel-glass rounded-xl p-4">
        <div className="font-display text-xs text-cyan-400/70 tracking-widest uppercase mb-1">⚕ Instrumentais cirúrgicos</div>
        <div className="text-sm text-cyan-300/70 font-mono">Cirurgia bariátrica laparoscópica · Bypass gástrico</div>
      </div>
      {grupos.map(g => (
        <div key={g.cat} className="panel-glass rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-cyan-500/5 transition-all"
            onClick={() => setExpanded(expanded === g.cat ? null : g.cat)}
          >
            <div className="flex items-center gap-2">
              <span>{g.icon}</span>
              <span className="font-display text-xs font-bold text-cyan-300 tracking-wider uppercase">{g.cat}</span>
              <span className="font-mono text-[0.6rem] text-cyan-700 border border-cyan-900 px-1.5 py-0.5 rounded">{g.items.length}</span>
            </div>
            <span className="text-cyan-600 text-xs font-mono">{expanded === g.cat ? '▲' : '▼'}</span>
          </button>
          {expanded === g.cat && (
            <div className="border-t border-cyan-900/50 divide-y divide-cyan-900/30">
              {g.items.map(item => (
                <div key={item.nome} className="p-4 hover:bg-cyan-500/3 transition-all">
                  <div className="font-semibold text-sm text-cyan-200">{item.nome}</div>
                  <div className="text-xs text-cyan-500 mt-1">Uso: {item.uso}</div>
                  <div className="font-mono text-[0.65rem] text-cyan-700 mt-1">Material: {item.material}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ChecklistTab({ items, onToggle }: { items: CheckItem[]; onToggle: (id: number) => void }) {
  const checked = items.filter(i => i.checked).length;
  const pct = Math.round((checked / items.length) * 100);
  const cats = [...new Set(items.map(i => i.category))];

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="panel-glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-display text-xs text-cyan-400/70 tracking-widest uppercase">☑️ Checklist de materiais</div>
          <div className="font-display text-lg font-bold text-glow-cyan" style={{ color: pct === 100 ? '#00ffcc' : '#00d4ff' }}>{pct}%</div>
        </div>
        <div className="h-2.5 rounded-full bg-cyan-950/60">
          <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-400' : ''}`}
            style={{ width: `${pct}%`, background: pct === 100 ? undefined : 'linear-gradient(90deg, #00d4ff, #00ffcc)', boxShadow: pct > 0 ? '0 0 8px rgba(0,212,255,0.6)' : 'none' }} />
        </div>
        <div className="font-mono text-xs text-cyan-600 mt-2">{checked} de {items.length} itens conferidos</div>
      </div>

      {/* Groups */}
      {cats.map(cat => (
        <div key={cat} className="panel-glass rounded-xl p-4 space-y-2">
          <div className="font-display text-[0.65rem] text-cyan-500/80 tracking-widest uppercase mb-3">{cat}</div>
          {items.filter(i => i.category === cat).map(item => (
            <div
              key={item.id}
              className={`checklist-item ${item.checked ? 'checked' : ''}`}
              onClick={() => onToggle(item.id)}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all ${item.checked ? 'bg-emerald-500/20 border border-emerald-400/60' : 'border border-cyan-700/50'}`}
                style={item.checked ? { boxShadow: '0 0 6px rgba(0,255,100,0.3)' } : {}}>
                {item.checked && <span className="text-emerald-400 text-xs">✓</span>}
              </div>
              <span className={`text-sm flex-1 transition-all ${item.checked ? 'text-emerald-300/80 line-through' : 'text-cyan-300'}`}>{item.label}</span>
              {item.checked && <span className="text-emerald-500/60 text-xs font-mono">OK</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function QuizTab({ onScoreUpdate }: { onScoreUpdate: (pts: number) => void }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = QUIZ[current];

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === q.correct) {
      const pts = score + 10;
      setScore(pts);
      onScoreUpdate(pts);
    }
  };

  const next = () => {
    if (current < QUIZ.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  };

  const restart = () => {
    setCurrent(0); setSelected(null); setScore(0); setFinished(false); onScoreUpdate(0);
  };

  if (finished) {
    const pct = Math.round((score / (QUIZ.length * 10)) * 100);
    return (
      <div className="panel-glass rounded-xl p-8 text-center space-y-4">
        <div className="text-5xl">🏆</div>
        <div className="font-display text-xl text-glow-cyan" style={{ color: '#00d4ff' }}>Quiz concluído!</div>
        <div className="font-mono text-4xl font-bold" style={{ color: pct >= 80 ? '#00ffcc' : '#00d4ff' }}>{score} pts</div>
        <div className="font-mono text-sm text-cyan-500">{pct}% de acerto · {QUIZ.length} questões</div>
        <div className="text-sm text-cyan-400">
          {pct >= 80 ? '🎖 Excelente! Domínio sólido do protocolo bariátrico.' : pct >= 60 ? '📘 Bom resultado! Revise os pontos marcados.' : '🔄 Continue estudando o protocolo cirúrgico.'}
        </div>
        <button className="btn-accent px-6 py-2" onClick={restart}>Reiniciar quiz</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="panel-glass rounded-xl p-4 flex items-center gap-4">
        <div className="font-mono text-xs text-cyan-500">{current + 1} / {QUIZ.length}</div>
        <div className="flex-1 h-1.5 bg-cyan-950/60 rounded-full">
          <div className="progress-bar-glow" style={{ width: `${((current) / QUIZ.length) * 100}%` }} />
        </div>
        <div className="font-display text-xs text-cyan-300 font-bold">{score} pts</div>
      </div>

      {/* Question */}
      <div className="panel-glass rounded-xl p-5">
        <div className="font-display text-[0.6rem] text-cyan-600 tracking-widest uppercase mb-3">❓ Questão {current + 1}</div>
        <div className="text-cyan-100 font-semibold leading-relaxed">{q.q}</div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            className={`quiz-option ${selected !== null ? i === q.correct ? 'correct' : i === selected ? 'wrong' : '' : ''}`}
            onClick={() => handleAnswer(i)}
          >
            <span className="font-mono text-cyan-600 mr-2">{String.fromCharCode(65 + i)}.</span>
            {opt}
          </button>
        ))}
      </div>

      {/* Explanation */}
      {selected !== null && (
        <div className="panel-glass rounded-xl p-4 border border-cyan-700/30">
          <div className="font-display text-[0.6rem] text-cyan-500 tracking-widest uppercase mb-1">
            {selected === q.correct ? '✅ Correto!' : '❌ Incorreto'}
          </div>
          <div className="text-sm text-cyan-300/80">{q.explanation}</div>
          <button className="btn-cyber mt-3 px-4 py-2" onClick={next}>
            {current < QUIZ.length - 1 ? 'Próxima →' : 'Ver resultado'}
          </button>
        </div>
      )}
    </div>
  );
}

function EtapasTab({ steps, onAdvance }: { steps: Step[]; onAdvance: () => void }) {
  return (
    <div className="space-y-3">
      <div className="panel-glass rounded-xl p-4">
        <div className="font-display text-xs text-cyan-400/70 tracking-widest uppercase">▣ Etapas da simulação</div>
        <div className="font-mono text-xs text-cyan-600 mt-0.5">Bypass gástrico em Y-de-Roux · Laparoscopia</div>
      </div>
      {steps.map((s, i) => (
        <div key={i} className={`step-card ${s.status === 'active' ? 'active-step' : s.status === 'done' ? 'completed-step' : ''}`}>
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-display font-bold
              ${s.status === 'done' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                s.status === 'active' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' :
                'bg-cyan-950/60 text-cyan-700 border border-cyan-900/50'}`}
              style={s.status === 'active' ? { boxShadow: '0 0 12px rgba(0,212,255,0.3)' } : {}}>
              {s.status === 'done' ? '✓' : i + 1}
            </div>
            <div className="flex-1">
              <div className={`font-semibold text-sm ${s.status === 'done' ? 'text-emerald-300/80' : s.status === 'active' ? 'text-cyan-200' : 'text-cyan-600'}`}>
                {s.title}
              </div>
              <div className="text-xs text-cyan-500/70 mt-1 leading-relaxed">{s.desc}</div>
              <div className="font-mono text-[0.62rem] mt-2 flex items-center gap-3">
                <span className="text-cyan-700">⏱ {s.duration}</span>
                <span className={`px-1.5 py-0.5 rounded border text-[0.6rem] ${
                  s.status === 'done' ? 'border-emerald-700/40 text-emerald-500 bg-emerald-950/30' :
                  s.status === 'active' ? 'border-cyan-600/40 text-cyan-400 bg-cyan-950/30' :
                  'border-cyan-900/40 text-cyan-800'
                }`}>
                  {s.status === 'done' ? 'Concluída' : s.status === 'active' ? 'Em andamento' : 'Aguardando'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
      {steps.some(s => s.status === 'active') && (
        <button className="btn-accent w-full py-3" onClick={onAdvance}>
          Avançar para próxima etapa →
        </button>
      )}
      {steps.every(s => s.status === 'done') && (
        <div className="panel-glass rounded-xl p-5 text-center border border-emerald-500/30" style={{ boxShadow: '0 0 20px rgba(0,255,100,0.07)' }}>
          <div className="text-3xl mb-2">🎉</div>
          <div className="font-display text-sm text-emerald-300 text-glow-green">Simulação concluída com sucesso!</div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<Tab>('painel');
  const [checklist, setChecklist] = useState<CheckItem[]>(CHECKLIST_ITEMS);
  const [quizScore, setQuizScore] = useState(0);
  const [steps, setSteps] = useState<Step[]>(STEPS);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleItem = (id: number) => {
    setChecklist(c => c.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const advanceStep = () => {
    setSteps(s => {
      const activeIdx = s.findIndex(x => x.status === 'active');
      if (activeIdx === -1) return s;
      return s.map((x, i) =>
        i === activeIdx ? { ...x, status: 'done' } :
        i === activeIdx + 1 ? { ...x, status: 'active' } : x
      );
    });
  };

  const nav: { tab: Tab; icon: string; label: string }[] = [
    { tab: 'painel', icon: '⌂', label: 'Painel' },
    { tab: 'chat', icon: '◉', label: 'Falar c/ robô' },
    { tab: 'instrumentos', icon: '⚕', label: 'Instrumentos' },
    { tab: 'checklist', icon: '☑️', label: 'Checklist' },
    { tab: 'quiz', icon: '❓', label: 'Quiz' },
    { tab: 'etapas', icon: '▣', label: 'Etapas' },
  ];

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(135deg, #020b18 0%, #031a35 50%, #020d1e 100%)' }}>
      {/* Background grid overlay */}
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      {/* Gradient orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,100,200,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,200,150,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      {/* Layout */}
      <div className="relative flex h-screen">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex flex-col w-52 border-r border-cyan-900/40 p-4 gap-1 flex-shrink-0"
          style={{ background: 'rgba(2,12,28,0.8)', backdropFilter: 'blur(16px)' }}>
          {/* Logo */}
          <div className="mb-5 px-1">
            <div className="font-display text-xs font-black tracking-widest text-glow-cyan" style={{ color: '#00d4ff' }}>CIRURBOT</div>
            <div className="font-mono text-[0.55rem] text-emerald-500 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" style={{ boxShadow: '0 0 4px #00ffcc' }} />
              SISTEMA ONLINE
            </div>
          </div>
          {nav.map(n => (
            <button key={n.tab} className={`nav-item ${tab === n.tab ? 'active' : ''}`} onClick={() => setTab(n.tab)}>
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
          {/* Bottom indicator */}
          <div className="mt-auto pt-4 border-t border-cyan-900/30">
            <div className="font-mono text-[0.55rem] text-cyan-800 leading-relaxed">
              Modo demonstração<br />
              Simulação bariátrica<br />
              v2.4.1 · CFM compliant
            </div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b border-cyan-900/40"
          style={{ background: 'rgba(2,10,24,0.95)', backdropFilter: 'blur(12px)' }}>
          <div className="font-display text-sm font-black text-glow-cyan" style={{ color: '#00d4ff' }}>CIRURBOT</div>
          <button className="text-cyan-400 font-mono text-xs border border-cyan-800/40 px-2.5 py-1.5 rounded" onClick={() => setSidebarOpen(o => !o)}>☰ Menu</button>
        </div>

        {/* Mobile drawer */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-56 p-4 space-y-1 border-r border-cyan-900/40"
              style={{ background: 'rgba(2,10,24,0.98)', backdropFilter: 'blur(20px)' }}>
              <div className="font-display text-xs font-black text-glow-cyan mb-4" style={{ color: '#00d4ff' }}>CIRURBOT</div>
              {nav.map(n => (
                <button key={n.tab} className={`nav-item w-full ${tab === n.tab ? 'active' : ''}`}
                  onClick={() => { setTab(n.tab); setSidebarOpen(false); }}>
                  <span>{n.icon}</span>
                  <span>{n.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
          <div className="max-w-2xl mx-auto p-4 md:p-6 pb-8">
            {/* Tab title */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="font-display text-base font-bold text-cyan-200">
                  {nav.find(n => n.tab === tab)?.icon} {nav.find(n => n.tab === tab)?.label}
                </div>
                <div className="font-mono text-[0.6rem] text-cyan-700 mt-0.5">Assistente de simulação cirúrgica · modo demo</div>
              </div>
            </div>

            {tab === 'painel' && <PainelTab steps={steps} checklist={checklist} quizScore={quizScore} quizTotal={QUIZ.length} onNav={setTab} />}
            {tab === 'chat' && <ChatTab />}
            {tab === 'instrumentos' && <InstrumentosTab />}
            {tab === 'checklist' && <ChecklistTab items={checklist} onToggle={toggleItem} />}
            {tab === 'quiz' && <QuizTab onScoreUpdate={setQuizScore} />}
            {tab === 'etapas' && <EtapasTab steps={steps} onAdvance={advanceStep} />}
          </div>
        </main>
      </div>
    </div>
  );
}
