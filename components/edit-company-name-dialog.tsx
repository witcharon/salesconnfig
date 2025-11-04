"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Pencil } from "lucide-react"
import type { UserWithSubscription } from "@/types/database"

const editCompanyNameSchema = z.object({
  company_name: z.string().nullable(),
})

type EditCompanyNameFormValues = z.infer<typeof editCompanyNameSchema>

interface EditCompanyNameDialogProps {
  user: UserWithSubscription
}

export function EditCompanyNameDialog({ user }: EditCompanyNameDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<EditCompanyNameFormValues>({
    resolver: zodResolver(editCompanyNameSchema),
    defaultValues: {
      company_name: user.company_name || null,
    },
  })

  const onSubmit = async (data: EditCompanyNameFormValues) => {
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/users/company-name", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          company_name: data.company_name || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Güncelleme başarısız")
        setLoading(false)
        return
      }

      setOpen(false)
      router.refresh()
      window.location.reload()
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.")
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Şirket Adı Düzenle</DialogTitle>
          <DialogDescription>
            {user.email} kullanıcısı için şirket adını ekleyin veya düzenleyin.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şirket Adı</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Şirket adını girin..."
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                İptal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Güncelleniyor..." : "Güncelle"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

