import p1 from "@/assets/property-1.jpg";
import p2 from "@/assets/property-2.jpg";
import p3 from "@/assets/property-3.jpg";
import p4 from "@/assets/property-4.jpg";
import p5 from "@/assets/property-5.jpg";
import p6 from "@/assets/property-6.jpg";

export type PropertyType = "Casa" | "Apartamento" | "Cobertura" | "Comercial";
export type Operation = "Venda" | "Aluguel";

export interface Property {
  id: string;
  title: string;
  neighborhood: string;
  city: string;
  price: number;
  type: PropertyType;
  operation: Operation;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  area: number;
  image: string;
  featured?: boolean;
}

export const properties: Property[] = [
  { id: "1", title: "Casa Moderna com Piscina", neighborhood: "Aparecida", city: "Santarém", price: 1250000, type: "Casa", operation: "Venda", bedrooms: 4, bathrooms: 4, parking: 3, area: 320, image: p1, featured: true },
  { id: "2", title: "Apartamento Vista Tapajós", neighborhood: "Centro", city: "Santarém", price: 4800, type: "Apartamento", operation: "Aluguel", bedrooms: 3, bathrooms: 2, parking: 2, area: 130, image: p2, featured: true },
  { id: "3", title: "Cobertura Beira-Rio Premium", neighborhood: "Salé", city: "Santarém", price: 1850000, type: "Cobertura", operation: "Venda", bedrooms: 4, bathrooms: 5, parking: 3, area: 240, image: p3, featured: true },
  { id: "4", title: "Casa Familiar com Jardim", neighborhood: "Maracanã", city: "Santarém", price: 720000, type: "Casa", operation: "Venda", bedrooms: 3, bathrooms: 3, parking: 2, area: 220, image: p4 },
  { id: "5", title: "Penthouse Panorâmica", neighborhood: "Liberdade", city: "Santarém", price: 2350000, type: "Cobertura", operation: "Venda", bedrooms: 4, bathrooms: 5, parking: 4, area: 280, image: p5 },
  { id: "6", title: "Sala Comercial Centro", neighborhood: "Centro", city: "Santarém", price: 6500, type: "Comercial", operation: "Aluguel", bedrooms: 0, bathrooms: 2, parking: 2, area: 140, image: p6 },
];

export const formatPrice = (price: number, op: Operation) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(price) +
  (op === "Aluguel" ? "/mês" : "");