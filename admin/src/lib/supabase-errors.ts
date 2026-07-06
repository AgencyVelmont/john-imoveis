type SafeSupabaseError = {
  code?: string;
  message?: string;
  details?: string;
};

export function logSupabaseError(context: string, error: unknown) {
  const safeError = toSafeSupabaseError(error);
  console.error(context, safeError);
}

export function propertySaveErrorMessage(
  error: unknown,
  action: "salvar" | "atualizar" = "salvar",
) {
  const safeError = toSafeSupabaseError(error);
  const code = safeError.code ?? "";
  const message = safeError.message ?? "";
  const details = safeError.details ?? "";
  const combinedMessage = `${message} ${details}`.toLowerCase();

  if (code === "42P01" || combinedMessage.includes("does not exist")) {
    return "A tabela necessária ainda não existe no Supabase. Aplique a migração do schema.";
  }

  if (code === "42703") {
    if (combinedMessage.includes("sale_price") || combinedMessage.includes("rental_price")) {
      return "O Supabase ainda não tem as colunas de valor de venda/locação. Aplique a migração de preços antes de salvar.";
    }

    return "Uma coluna esperada não existe no Supabase. Verifique se a migração mais recente foi aplicada.";
  }

  if (code === "42501" || combinedMessage.includes("row-level security")) {
    return "Sua sessão não tem permissão para salvar este imóvel. Verifique o perfil administrativo.";
  }

  if (code === "23514") {
    if (
      combinedMessage.includes("properties_purpose_check") ||
      combinedMessage.includes("venda_locacao")
    ) {
      return "O Supabase ainda não aceita imóveis marcados como venda e locação. Aplique a migração da finalidade do imóvel.";
    }

    if (combinedMessage.includes("3 fotos")) {
      return "Adicione pelo menos 3 fotos antes de publicar o imóvel.";
    }

    if (combinedMessage.includes("15 fotos")) {
      return "O limite máximo é de 15 fotos por imóvel.";
    }

    return "Algum dado informado violou uma regra de validação do banco.";
  }

  if (code === "23505") {
    return "Já existe um registro com o mesmo slug ou código. Ajuste o cadastro e tente novamente.";
  }

  if (combinedMessage.includes("unauthorized")) {
    return "Sua sessão expirou ou não foi aceita pelo servidor de uploads. Faça login novamente.";
  }

  if (message) return message;

  return `Erro ao ${action} imóvel. Verifique os dados e tente novamente.`;
}

function toSafeSupabaseError(error: unknown): SafeSupabaseError {
  if (!error || typeof error !== "object") return {};

  const maybeError = error as SafeSupabaseError;

  return {
    code: typeof maybeError.code === "string" ? maybeError.code : undefined,
    message: typeof maybeError.message === "string" ? maybeError.message : undefined,
    details: typeof maybeError.details === "string" ? maybeError.details : undefined,
  };
}
