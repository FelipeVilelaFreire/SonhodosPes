export const STRINGS = {
  app: {
    name: 'Sonho dos Pés',
    tagline: 'Consulta de Preços',
    shortName: 'SDP',
  },

  actions: {
    save: 'Salvar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Excluir',
    back: 'Voltar',
    add: 'Adicionar',
    create: 'Criar',
    close: 'Fechar',
    loading: 'Carregando...',
    saving: 'Salvando...',
    updating: 'Atualizando...',
    confirm: 'Confirmar',
    clear: 'Limpar',
    clearAll: 'Limpar tudo',
    newSearch: 'Nova consulta',
    tryAgain: 'Tentar novamente',
    scan: 'Escanear QR',
    viewSite: 'Ver no site',
  },

  status: {
    online: 'Online',
    offline: 'Offline',
  },

  search: {
    label: 'Buscar produto',
    placeholder: 'Código, nome ou marca',
    hint: 'Digite os dígitos do código ou parte do nome',
    notFound: (query: string) => `Nenhum produto encontrado para "${query}"`,
  },

  stack: {
    empty: {
      title: 'Pronto para consultar',
      description: 'Digite um código, modelo ou marca no campo acima.',
    },
    count: (n: number) => (n === 1 ? '1 consulta' : `${n} consultas`),
    confirmClearAll: (n: number) => `Remover as ${n} consultas da tela?`,
  },

  product: {
    priceLabel: 'Preço',
    sizesLabel: 'Tamanhos · Estoque',
    codeLabel: 'Código',
    brandLabel: 'Marca',
    categoryLabel: 'Categoria',
    locationLabel: 'Localização',
    corTamHeader: 'COR / TAM',
    corHeader: 'COR',
    qtdHeader: 'QTD',
    esgotado: 'ESGOTADO',
    semEstoque: 'Sem estoque em nenhum tamanho',
    totalPares: (n: number, cores: number) =>
      `${n} ${n === 1 ? 'par' : 'pares'} · ${cores} ${cores === 1 ? 'cor' : 'cores'}`,
    naoInformado: 'Não informado',
  },

  pin: {
    titleVerify: 'Digite o PIN',
    titleCreate: 'Crie um PIN',
    titleConfirm: 'Confirme o PIN',
    titleChange: 'Novo PIN',
    subtitleVerify: '4 dígitos para acessar',
    subtitleSave: 'Confirme o PIN para salvar a URL',
    subtitleCreate: '4 dígitos para proteger as configurações',
    subtitleConfirm: 'Digite os 4 dígitos novamente',
    errorIncorrect: 'PIN incorreto',
    errorMismatch: 'Os PINs não coincidem',
    definedToast: 'PIN definido ✓',
    removedToast: 'PIN removido',
  },

  settings: {
    title: 'Configurações',
    tablePrices: 'Tabela de preços',
    tableInfoEmpty: 'Nenhuma tabela carregada',
    tableInfoUpdated: (date: string) => `Atualizada em ${date}`,
    updateNow: 'Atualizar tabela agora',
    csvUrlTitle: 'URL da planilha (CSV)',
    csvUrlDescription:
      'Link público da planilha do Google Sheets publicada como CSV.',
    csvUrlPlaceholder: 'https://docs.google.com/...',
    saveUrl: 'Salvar URL',
    totalProdutos: (n: number) =>
      `${n} ${n === 1 ? 'produto' : 'produtos'} no cadastro`,
    totalTitle: 'Total de produtos',
  },

  auth: {
    login: {
      title: 'Entrar',
      emailLabel: 'Email',
      emailPlaceholder: 'seu@email.com',
      passwordLabel: 'Senha',
      passwordPlaceholder: 'Sua senha',
      submitButton: 'Entrar',
      magicLinkButton: 'Enviar link mágico',
      errorInvalid: 'Email ou senha inválidos',
      errorGeneric: 'Erro ao fazer login',
    },
    logout: 'Sair',
  },

  toast: {
    urlSaved: 'URL salva ✓',
    urlInvalid: 'URL inválida',
    urlRequired: 'Informe uma URL válida',
    noConnection: 'Sem conexão — impossível atualizar',
    updated: (n: number) => `${n} produtos atualizados ✓`,
    updateError: 'Erro ao atualizar tabela',
    connected: 'Conectado à internet',
    offlineMode: 'Modo offline',
    configurePinFirst: 'Configure o PIN antes',
  },

  errors: {
    generic: 'Algo deu errado. Tente novamente.',
    notFound: 'Página não encontrada.',
    unauthorized: 'Você não tem permissão para isso.',
    network: 'Sem conexão. Verifique sua internet.',
    loadFailed: 'Falha ao carregar dados',
  },

  sync: {
    never: 'Sem dados carregados',
    lastUpdate: (date: string) => `Última atualização: ${date}`,
    openSettings: 'Abra as configurações para carregar a tabela',
  },
} as const;
