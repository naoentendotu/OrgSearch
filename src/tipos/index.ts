//informações do objeto contrato
export interface InfoContrato { 
  numeroContratoEmpenho: string;
  dataVigenciaInicio: string;    
  dataVigenciaFim: string;      
  nomeRazaoSocialFornecedor: string; 
  objetoContrato: string;     
  valorInicial: number;         
  cnpjFornecedor?: string;      
}

//informações do objeto orgão
export interface InfoOrgao {
  razaoSocial: string;           
  cnpj: string;                
  ufNome: string;                
  municipioNome: string;         
}
