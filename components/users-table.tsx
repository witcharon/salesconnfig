"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Pencil } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale/tr"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { UserWithSubscription } from "@/types/database"
import { EditSubscriptionDialog } from "./edit-subscription-dialog"

export const columns: ColumnDef<UserWithSubscription>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Mail
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "phone",
    header: "Telefon",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string | null
      return <div>{phone || "-"}</div>
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Oluşturulma Tarihi
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string
      return (
        <div>
          {format(new Date(date), "dd MMM yyyy HH:mm", { locale: tr })}
        </div>
      )
    },
  },
  {
    accessorKey: "updated_at",
    header: "Güncelleme Tarihi",
    cell: ({ row }) => {
      const date = row.getValue("updated_at") as string | null
      return (
        <div>{date ? format(new Date(date), "dd MMM yyyy HH:mm", { locale: tr }) : "-"}</div>
      )
    },
  },
  {
    accessorKey: "last_sign_in_at",
    header: "Son Giriş",
    cell: ({ row }) => {
      const date = row.getValue("last_sign_in_at") as string | null
      return (
        <div>{date ? format(new Date(date), "dd MMM yyyy HH:mm", { locale: tr }) : "-"}</div>
      )
    },
  },
  {
    accessorKey: "id",
    header: "User ID",
    cell: ({ row }) => {
      const id = row.getValue("id") as string
      return (
        <div className="font-mono text-xs max-w-[200px] truncate">{id}</div>
      )
    },
  },
  {
    id: "subscription",
    header: "Plan",
    cell: ({ row }) => {
      const subscription = row.original.subscription
      if (!subscription) return <div>-</div>
      const planColors = {
        free: "secondary",
        pro: "default",
        team: "default",
      } as const
      return (
        <Badge variant={planColors[subscription.plan_id] || "secondary"}>
          {subscription.plan_id === "free"
            ? "Free"
            : subscription.plan_id === "pro"
            ? "Pro"
            : "Team"}
        </Badge>
      )
    },
  },
  {
    id: "status",
    header: "Durum",
    cell: ({ row }) => {
      const subscription = row.original.subscription
      if (!subscription) return <div>-</div>
      return (
        <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
          {subscription.status === "active" ? "Aktif" : "Pasif"}
        </Badge>
      )
    },
  },
  {
    id: "current_period_end",
    header: "Lisans Bitişi",
    cell: ({ row }) => {
      const subscription = row.original.subscription
      if (!subscription || !subscription.current_period_end) return <div>-</div>
      return (
        <div>
          {format(new Date(subscription.current_period_end), "dd MMM yyyy HH:mm", { locale: tr })}
        </div>
      )
    },
  },
  {
    id: "language",
    header: "Dil",
    cell: ({ row }) => {
      const subscription = row.original.subscription
      if (!subscription) return <div>-</div>
      return <div className="uppercase">{subscription.language}</div>
    },
  },
  {
    id: "logo",
    header: "Logo",
    cell: ({ row }) => {
      const subscription = row.original.subscription
      if (!subscription || !subscription.logo) return <div>-</div>
      return (
        <div className="max-w-[100px] truncate text-xs">{subscription.logo}</div>
      )
    },
  },
  {
    id: "is_crm",
    header: "CRM",
    cell: ({ row }) => {
      const subscription = row.original.subscription
      if (!subscription) return <div>-</div>
      return (
        <Badge variant={subscription.is_crm ? "default" : "secondary"}>
          {subscription.is_crm ? "Aktif" : "Pasif"}
        </Badge>
      )
    },
  },
  {
    id: "is_campaign",
    header: "Campaign",
    cell: ({ row }) => {
      const subscription = row.original.subscription
      if (!subscription) return <div>-</div>
      return (
        <Badge variant={subscription.is_campaign ? "default" : "secondary"}>
          {subscription.is_campaign ? "Aktif" : "Pasif"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original
      return <EditSubscriptionDialog user={user} />
    },
  },
]

interface UsersTableProps {
  data: UserWithSubscription[]
}

export function UsersTable({ data }: UsersTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Mail ile filtrele..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Sütunlar <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Sonuç bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredRowModel().rows.length} kullanıcı gösteriliyor
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Önceki
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  )
}

