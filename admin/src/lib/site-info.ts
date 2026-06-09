export const siteInfo = {
  name: "Felipe Vasconcelos",
  title: "Felipe Vasconcelos | Imóveis de Alto Padrão em Santarém",
  description:
    "Curadoria imobiliária de alto padrão para compra, venda e locação em Santarém e região.",
  url: "https://felipecorretor.com.br",
  instagramUrl: "https://instagram.com/felipee.vasconcelos_",
  instagramHandle: "@felipee.vasconcelos_",
  phoneDisplay: "+55 93 9217-7692",
  phoneHref: "tel:+559392177692",
  whatsappNumber: "559392177692",
  whatsappMessage: "Olá Felipe, vim pelo site e gostaria de mais informações sobre um imóvel.",
  email: "contato@felipecorretor.com.br",
  city: "Santarém",
  region: "PA",
};

export function buildWhatsappUrl(message = siteInfo.whatsappMessage) {
  return `https://wa.me/${siteInfo.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsappUrlForPhone(phone: string, message = siteInfo.whatsappMessage) {
  const digits = phoneToDigits(phone);
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function buildPhoneHref(phone: string) {
  const digits = phoneToDigits(phone);
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;

  return `tel:+${normalized}`;
}

export function phoneToDigits(phone: string) {
  return phone.replace(/\D/g, "");
}
