import React, { useState } from "react";
import { fetchOrgaoInfo } from "../api/pncpAPI";
import { InfoOrgao, InfoContrato } from "../tipos/index";
import { AxiosError } from "axios";

const Search: React.FC = () => {
  //armazena os valores de entrada para a busca
  const [cnpj, setCnpj] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [orgao, setOrgao] = useState<InfoOrgao | null>(null);
  const [contratos, setContratos] = useState<InfoContrato[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contratosSomados, setValorTotal] = useState<number | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      //remove qualquer simbolo que nao seja número para ser compativel com formato da api
      const cnpjLimpo = cnpj.replace(/\D/g, "");

      //uso da verificacao de cnpj
      if (cnpjLimpo.length !== 14) {
        throw new Error("CNPJ deve conter 14 dígitos.");
      }

      //busca na api as informações do orgão
      const response = await fetchOrgaoInfo(
        cnpjLimpo,
        dataInicial,
        dataFinal,
        1
      );

      if (response.orgao) {
        const cnpjRetornado = response.orgao.cnpj.replace(/\D/g, ""); // Obtém o CNPJ retornado da API

        //verifica se esta buscando o cnpj correto na api
        if (cnpjRetornado !== cnpjLimpo) {
          throw new Error(
            "O CNPJ buscado não corresponde ao CNPJ retornado pela API."
          );
        }

        setOrgao(response.orgao);

        //filtro pelas dadas de vigencia inicial e final
        const contratosEncontrados = response.contratos.filter((contract) => {
          const vigenciaInicio = new Date(contract.dataVigenciaInicio);
          const vigenciaFim = new Date(contract.dataVigenciaFim);
          const inicio = new Date(dataInicial);
          const fim = new Date(dataFinal);
          return vigenciaInicio >= inicio && vigenciaInicio <= fim;
        });

        setContratos(contratosEncontrados);

        //calcula o valor total dos contratos buscados
        const contratosSomados = contratosEncontrados.reduce(
          (sum, contrato) => sum + contrato.valorInicial,
          0
        );

        setValorTotal(contratosSomados);
      }
    } catch (err) {
      //erros que podem acontecer na busca
      if (err instanceof AxiosError) {
        console.error("Erro detalhado da API:", err.response?.data);
        setError(err.response?.data?.message || "Erro desconhecido.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro desconhecido.");
      }
    } finally {
      setLoading(false);
    }
  };

  //funcao para fazer download do resultado da busca na api
  const baixarContratos = () => {
    const data = {
      orgao,
      contratos,
      contratosSomados,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contratos${cnpj}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-2 sm:px-6 md:px-8 lg:px-10 justify-center">
      <div className="flex-shrink-0 flex items-center justify-center  md:mt-1 md:ml-4">
        <img
          src="/imagens/logo3.png"
          alt="imagem logo"
          className="h-32 w-96 object-contain"
        />
      </div>

      {/*campo de entrada dos dados para busca*/}
      <div className="flex flex-col md:flex-row justify-center items-center">
        <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-md mx-6 my-14 flex-1 md:ml-28">
          <div className="flex flex-col w-full">
            <label className="block mb-1 text-sm text-slate-800">CNPJ:</label>
            <input
              type="text"
              placeholder="XX.XXX.XXX/0001-XX"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className="border rounded-lg p-4 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-[#1B5E20] transition duration-300"
            />
          
            <label className="block mb-1 text-sm text-slate-800">
              Data Inicial:
            </label>
            <input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              className="border rounded-lg p-4 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-[#1B5E20] transition duration-300"
            />
            <label className="block mb-1 text-sm text-slate-800">
              Data Final:
            </label>
            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="border rounded-lg p-4 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-[#1B5E20] transition duration-300"
            />
            <button
              onClick={handleSearch}
              className="bg-[#1B5E20] text-white font-bold py-4 rounded-lg shadow transition ease-in-out delay-100 bg-[#1B5E20] hover:-translate-y-1 hover:bg-[#1B5E20] duration-50"
            >
              Buscar contratos
            </button>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center md:mt-1 md:ml-15 ml-14">
          <img
            src="/imagens/files2.gif"
            alt="imagem busca"
            className="h-5/6 w-5/6 object-contain"
          />
        </div>
      </div>

      {loading && (
        <p className="text-[#1B5E20] text-center animate-bounce ease-out duration-75">
          Buscando contratos...
        </p>
      )}

      {/*exibição de mensagem de erro*/}
      {error && <p className="text-red-600 mt-1 text-center">{error}</p>}

      {/*mostra informações do órgão*/}
      {orgao && (
        <div className="mx-24 bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-[#1B5E20] text-2xl font-bold mb-6">
            Informações do Órgão
          </h2>

          <p className="mb-1">
            <strong>Razão Social:</strong> {orgao.razaoSocial}
          </p>
          <p className="mb-1">
            <strong>CNPJ:</strong> {orgao.cnpj}
          </p>
          <p className="mb-1">
            <strong>UF:</strong> {orgao.ufNome}
          </p>
          <p className="mb-1">
            <strong>Município:</strong> {orgao.municipioNome}
          </p>
          {contratosSomados !== null && (
            <p className="text-lg font-bold text-center mt-4">
              Valor Total dos Contratos:{" "}
              {contratosSomados.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          )}
        </div>
      )}

      {/*mostra lista de contratos com seu nome*/}
      {contratos.length > 0 && (
        <div className="mt-6 mx-24 bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="text-right flex justify-between mb-6 items-center ">
            <h2 className="text-[#1B5E20] text-2xl font-bold">Contratos</h2>

            <button
              onClick={() => {
                baixarContratos();
              }}
              className="bg-[#1B5E20] text-white font-bold py-2 px-4 rounded-lg shadow transition ease-in-out delay-150 hover:-translate-y-1 hover:bg-[#1B5E20] duration-100 flex items-center"
            >
              <img
                src="imagens/downloadIcon.png"
                alt="icon download"
                className="h-4 w-4 object-contain mr-2"
              />
              Download
            </button>
          </div>

          {contratos.map((contrato, index) => (
            <div key={index} className="border-b p-2 border-gray-200 pb-4">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleExpand(index)}
              >
                <h3 className="text-lg font-semibold hover:underline">
                  {contrato.numeroContratoEmpenho}
                </h3>
                <span className="text-sm text-gray-500 ">
                  {expandedIndex === index
                    ? "Ocultar detalhes"
                    : "Mostrar detalhes"}
                </span>
              </div>

              {/*informações focada em um contrato*/}
              {expandedIndex === index && (
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <p>
                    <strong>Data Vigência Inicial:</strong>{" "}
                    {contrato.dataVigenciaInicio}
                  </p>
                  <p>
                    <strong>Data Vigência Final:</strong>{" "}
                    {contrato.dataVigenciaFim}
                  </p>
                  <p>
                    <strong>Fornecedor:</strong>{" "}
                    {contrato.nomeRazaoSocialFornecedor}
                  </p>
                  <p>
                    <strong>CNPJ do Fornecedor:</strong>{" "}
                    {contrato.cnpjFornecedor}
                  </p>
                  <p>
                    <strong>Objeto:</strong> {contrato.objetoContrato}
                  </p>
                  <p>
                    <strong>Valor Inicial:</strong>{" "}
                    {contrato.valorInicial.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div>
        <footer className="text-xs text-gray-500 text-center m-full mt-auto">
          <p>
            © 2024 OrgSearch. Desenvolvido por{" "}
            <a href="https://github.com/naoentendotu" className="underline">
              Tuliana Andrade
            </a>
            .
            <br />
            <a href="https://storyset.com/data" className="underline">
              Data illustrations by Storyset
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Search;
