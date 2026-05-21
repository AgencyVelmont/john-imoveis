export const WHATSAPP_NUMBER = "5500000000000"; // TODO: substituir pelo número real
export const WHATSAPP_LINK = (msg = "Olá Felipe, vim pelo site e gostaria de mais informações.") =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

export const SITE = {
  name: "Felipe Vasconcelos",
  role: "Corretor de Imóveis",
  email: "contato@felipevasconcelos.com.br",
  phone: "(00) 00000-0000",
  region: "Atendimento em toda a região",
  address: "Av. Principal, 1000 — Centro",
  instagram: "https://instagram.com/felipevasconcelos",
  mapsQuery: "Av. Principal 1000",
};