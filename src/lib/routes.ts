// src/lib/routes.ts

type Id = string | number;

function enc(v: Id) {
  return encodeURIComponent(String(v));
}

export const routes = {
  home: () => "/",
  login: () => "/login",
  dashboard: () => "/dashboard",
  reports: {
    home: () => "/reports",
    sales: {
      pdf: (queryString?: string) =>
        queryString
          ? `/reports/sales/pdf?${queryString}`
          : `/reports/sales/pdf`,
    },
  },

  products: {
    list: () => "/products",
    new: () => "/products/new",
    edit: (id: Id) => `/products/${enc(id)}/edit`,
  },

  salesNotes: {
    list: () => "/sales-notes",
    new: () => "/sales-notes/new",
    edit: (id: Id) => `/sales-notes/${enc(id)}/edit`,
    details: (id: Id) => `/sales-notes/${enc(id)}`,
    pdf: (id: string) => `/sales-notes/${id}/pdf`,

    payments: {
      new: (salesNoteId: Id) => `/sales-notes/${enc(salesNoteId)}/payments/new`,
      edit: (salesNoteId: Id, paymentId: Id) =>
        `/sales-notes/${enc(salesNoteId)}/payments/${enc(paymentId)}/edit`,
    },
  },

  parties: {
    list: () => "/parties",
    new: () => "/parties/new",
    details: (id: Id) => `/parties/${enc(id)}`,
    edit: (id: Id) => `/parties/${enc(id)}/edit`,
  },

  supplierPurchases: {
    list: () => "/supplier-purchases",
    new: () => "/supplier-purchases/new",
    details: (id: Id) => `/supplier-purchases/${enc(id)}`,
    edit: (id: Id) => `/supplier-purchases/${enc(id)}/edit`,
    payments: {
      new: (purchaseId: Id) =>
        `/supplier-purchases/${enc(purchaseId)}/payments/new`,
      edit: (id: string, paymentId: string) =>
        `/supplier-purchases/${enc(id)}/payments/${enc(paymentId)}/edit`,
    },
  },

  quotations: {
    list: () => "/quotations",
    details: (id: string) => `/quotations/${id}`,
    edit: (id: string) => `/quotations/${id}/edit`,
    new: () => "/quotations/new",
    pdf: (id: string) => `/quotations/${id}/pdf`,
    // Nuevo método para crear nota de venta desde una cotización
    createSalesNote: (quotationId: Id) =>
      `${routes.salesNotes.new()}?fromQuotationId=${enc(quotationId)}`,
  },
} as const;
