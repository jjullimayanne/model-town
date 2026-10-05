/**
 * The "Manual da Cidade": the knowledge base the citizen chatbot must answer from.
 * Each paragraph is one chunk. Order matters for the naive step: whatever falls after the
 * context window is cut off, so some answers sit near the end on purpose.
 */

export interface ManualDoc {
  id: string;
  title: string;
  paragraphs: string[];
}

export const MANUAL: ManualDoc[] = [
  {
    id: 'biblioteca',
    title: 'Biblioteca Municipal',
    paragraphs: [
      'A Biblioteca Municipal funciona de segunda a sexta das 8h às 20h e aos sábados das 9h às 13h. Aos domingos ela fica fechada.',
      'Para pegar livros emprestados basta apresentar um documento com foto e um comprovante de endereço. O prazo de devolução é de 15 dias.',
    ],
  },
  {
    id: 'onibus',
    title: 'Transporte público',
    paragraphs: [
      'A linha 12 de ônibus liga o Centro ao Hospital Municipal a cada 20 minutos. A linha 7 atende a Vila Nova e o Parque das Águas.',
      'Estudantes e idosos têm passe livre. O cartão de transporte pode ser retirado no terminal central com documento.',
    ],
  },
  {
    id: 'vacina',
    title: 'Saúde',
    paragraphs: [
      'A campanha de vacinação contra a gripe acontece em todos os postos de saúde, de segunda a sexta, das 8h às 17h. Leve a carteira de vacinação.',
      'Consultas com clínico geral são agendadas pelo telefone 156 ou direto no posto de saúde do seu bairro.',
    ],
  },
  {
    id: 'escolas',
    title: 'Educação',
    paragraphs: [
      'As matrículas nas escolas municipais abrem em novembro. Os pais devem levar a certidão de nascimento da criança e um comprovante de residência.',
      'Todas as escolas oferecem merenda e transporte escolar para alunos que moram a mais de dois quilômetros.',
    ],
  },
  {
    id: 'feira',
    title: 'Feira e comércio',
    paragraphs: [
      'A feira livre acontece aos domingos na Praça Central, das 6h ao meio-dia, com frutas, verduras e artesanato local.',
      'Quem quer abrir um comércio precisa pedir o alvará de funcionamento na Secretaria de Desenvolvimento.',
    ],
  },
  {
    id: 'animais',
    title: 'Animais',
    paragraphs: [
      'A castração gratuita de cães e gatos é feita no Centro de Zoonoses. As vagas são liberadas toda primeira segunda-feira do mês.',
      'Animais perdidos podem ser procurados no abrigo municipal, que fica aberto para adoção nos fins de semana.',
    ],
  },
  {
    id: 'agua',
    title: 'Água e energia',
    paragraphs: [
      'Em caso de falta de água ou vazamento na rua, ligue para a companhia de saneamento pelo 0800 77 1234, que atende 24 horas.',
      'Postes com a lâmpada queimada podem ser informados no aplicativo da prefeitura, na aba Iluminação.',
    ],
  },
  {
    id: 'eventos',
    title: 'Eventos',
    paragraphs: [
      'A Festa da Cidade acontece em agosto no Parque das Águas, com shows gratuitos, comidas típicas e fogos à meia-noite.',
      'O cinema ao ar livre exibe filmes toda sexta-feira à noite na praça do Centro Cultural.',
    ],
  },
  {
    id: 'obras',
    title: 'Obras e travessias',
    paragraphs: [
      'A ponte Central está fechada para reparos até o fim do mês. Pedestres e carros devem usar a ponte do rio Azul, que segue liberada.',
      'As obras de recapeamento acontecem durante a madrugada para não atrapalhar o trânsito.',
    ],
  },
  {
    id: 'residuos',
    title: 'Limpeza urbana',
    paragraphs: [
      'A coleta de resíduos domiciliares acontece às terças e sextas pela manhã. Deixe os sacos na calçada até as 7h.',
      'Materiais recicláveis como papel, vidro e plástico são recolhidos às quintas. Entulho e móveis velhos precisam de agendamento.',
    ],
  },
  {
    id: 'iptu',
    title: 'Tributos',
    paragraphs: [
      'O IPTU pode ser quitado pelo boleto enviado em março ou pelo aplicativo da prefeitura, à vista com desconto ou em até 10 parcelas.',
      'Aposentados com renda de até dois salários mínimos podem pedir isenção do tributo na Secretaria da Fazenda.',
    ],
  },
];

export interface Chunk {
  id: string;
  doc: string;
  title: string;
  text: string;
}

export const CHUNKS: Chunk[] = MANUAL.flatMap((d) =>
  d.paragraphs.map((text, i) => ({ id: `${d.id}-${i}`, doc: d.id, title: d.title, text })),
);

export const MANUAL_TEXT = MANUAL.map((d) => `# ${d.title}\n${d.paragraphs.join('\n')}`).join('\n\n');

export interface CitizenQuestion {
  id: string;
  who: string;
  text: string;
  /** The chunk that holds the answer. */
  answer: string;
  good: string;
  /** What the "AI" makes up when the right chunk is not in its context. */
  bad: string;
}

export const QUESTIONS: CitizenQuestion[] = [
  {
    id: 'biblio', who: 'Dona Cida', text: 'Até que horas a biblioteca abre no sábado?', answer: 'biblioteca-0',
    good: 'Aos sábados a biblioteca abre das 9h às 13h.', bad: 'A biblioteca abre todos os dias até as 22h.',
  },
  {
    id: 'onibus', who: 'Seu Jorge', text: 'Qual ônibus vai para o hospital?', answer: 'onibus-0',
    good: 'A linha 12 liga o Centro ao Hospital Municipal, a cada 20 minutos.', bad: 'A linha 3 vai para o hospital.',
  },
  {
    id: 'vacina', who: 'Bia', text: 'Onde posso me vacinar contra a gripe?', answer: 'vacina-0',
    good: 'Em qualquer posto de saúde, de segunda a sexta, das 8h às 17h. Leve a carteira de vacinação!', bad: 'Só no Hospital Municipal, com agendamento.',
  },
  {
    id: 'pontes', who: 'Caio', text: 'As pontes estão fechadas?', answer: 'obras-0',
    good: 'Só a ponte Central, até o fim do mês. A ponte do rio Azul segue liberada.', bad: 'Não, todas as pontes estão funcionando normalmente.',
  },
  {
    id: 'lixo', who: 'Dona Cida', text: 'Que dia o caminhão de lixo passa na minha rua?', answer: 'residuos-0',
    good: 'Às terças e sextas de manhã. Deixe os sacos na calçada até as 7h.', bad: 'O caminhão passa às segundas à noite.',
  },
  {
    id: 'iptu', who: 'Seu Jorge', text: 'Como eu pago o imposto da minha casa?', answer: 'iptu-0',
    good: 'Pelo boleto de março ou pelo app da prefeitura: à vista com desconto ou em até 10 parcelas.', bad: 'Precisa ir pessoalmente ao banco com o carnê.',
  },
];
