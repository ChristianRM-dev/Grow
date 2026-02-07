import React from "react"

import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs"
import type { BreadcrumbItem } from "@/components/ui/Breadcrumbs/Breadcrumbs.types"
import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout"

type FormPageScaffoldProps = {
  title: string
  description: string
  backHref: string
  breadcrumbs: BreadcrumbItem[]
  children: React.ReactNode
}

export function FormPageScaffold({
  title,
  description,
  backHref,
  breadcrumbs,
  children,
}: FormPageScaffoldProps) {
  return (
    <FormPageLayout
      title={title}
      description={description}
      backHref={backHref}
      breadcrumbs={<Breadcrumbs items={breadcrumbs} />}
    >
      {children}
    </FormPageLayout>
  )
}
