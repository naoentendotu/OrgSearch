import axios from "axios";
import { InfoOrgao, InfoContrato } from "../tipos/index";

// verificar se o CNPJ tem 14 digitos
const isValidCnpj = (cnpj: string): boolean => {
  const cnpjRegex = /^\d{14}$/; 
  return cnpjRegex.test(cnpj);
};

// busca as informacoes de contratos do orgao
export const fetchOrgaoInfo = async (
  cnpj: string,
  dataInicial: string,
  dataFinal: string,
  pagina: number
): Promise<{ orgao: InfoOrgao; contratos: InfoContrato[] }> => {

  //erro se o CNPJ for inválido
  if (!isValidCnpj(cnpj)) {
    throw new Error("CNPJ inválido.");
  }


  const startDate = new Date(dataInicial);
  const endDate = new Date(dataFinal);

  console.log("CNPJ:", cnpj);
  console.log("Data Inicial:", dataInicial);
  console.log("Data Final:", dataFinal);

  //erro é apresentado se a data inicial for depois da final
  if (startDate > endDate) {
    throw new Error("A data inicial deve ser anterior à data final.");
  }

  // formata a data para o formato igual da api
  const formattedDataInicial = dataInicial.replace(/-/g, "");
  const formattedDataFinal = dataFinal.replace(/-/g, "");

  //a busca na api
  try {
    const response = await axios.get(
      `https://pncp.gov.br/api/consulta/v1/contratos`,
      {
        params: {
          cnpjOrgao: cnpj,
          dataInicial: formattedDataInicial,
          dataFinal: formattedDataFinal,
          pagina,
        },
      }
    );

    console.log("Resposta da API:", response.data);

    if (!response.data.data || response.data.data.length === 0) {
      throw new Error("Nenhum contrato encontrado para o CNPJ informado.");
    }

    //extrai pelo contrato os dados do orgao que é retornado primeiro
    const orgao: InfoOrgao = {
      razaoSocial: response.data.data[0].orgaoEntidade.razaoSocial,
      cnpj: response.data.data[0].orgaoEntidade.cnpj,
      ufNome: response.data.data[0].unidadeOrgao.ufNome,
      municipioNome: response.data.data[0].unidadeOrgao.municipioNome,
    };

    //extrai os contratos
    const contratos: InfoContrato[] = response.data.data.map(
      (contrato: any) => ({
        numeroContratoEmpenho: contrato.numeroContratoEmpenho,
        dataVigenciaInicio: contrato.dataVigenciaInicio,
        dataVigenciaFim: contrato.dataVigenciaFim,
        nomeRazaoSocialFornecedor: contrato.nomeRazaoSocialFornecedor,
        objetoContrato: contrato.objetoContrato,
        valorInicial: contrato.valorInicial,
        cnpjFornecedor: contrato.niFornecedor,
      })
    );

    return { orgao, contratos };
  } catch (error) {
    console.error("Erro ao buscar informações:", error);

    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", error.response?.data);
      throw new Error(
        error.response?.data?.message || "Erro ao buscar informações do órgão."
      );
    } else {
      throw new Error("Erro na API ao buscar informações do órgão. (COD 500)");
    }
  }
};
