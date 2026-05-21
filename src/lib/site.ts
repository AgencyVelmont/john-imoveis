export const WHATSAPP_NUMBER = "5593000000000"; // TODO: substituir pelo número real (DDD 93 — Santarém-PA)
export const WHATSAPP_LINK = (msg = "Olá Felipe, vim pelo site e gostaria de mais informações.") =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

export const SITE = {
  name: "Felipe Vasconcelos",
  role: "Corretor de Imóveis",
  creci: "CRECI-PA 0000",
  email: "contato@felipevasconcelos.com.br",
  phone: "(93) 00000-0000",
  region: "Santarém e região — Pará",
  address: "Centro — Santarém, PA",
  instagram: "https://instagram.com/felipevasconcelos",
  mapsQuery: "Santarém, PA",
};