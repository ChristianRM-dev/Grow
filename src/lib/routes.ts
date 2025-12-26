// src/lib/routes.ts

type Id = string | number;

function enc(v: Id) {
  return encodeURIComponent(String(v));
}

export const routes = {
  home: () => "/",
  login: () => "/login",
  dashboard: () => "/dashboard",

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

    payments: {
      new: (salesNoteId: Id) => `/sales-notes/${enc(salesNoteId)}/payments/new`,
      edit: (salesNoteId: Id, paymentId: Id) =>
        `/sales-notes/${enc(salesNoteId)}/payments/${enc(paymentId)}/edit`,
    },
  },
} as const;
