"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "@/lib/auth-client"
import { RedirectToSignIn } from "@daveyplate/better-auth-ui"
import Unauthorized from "@/components/unauthorized"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
    CircleNotch,
    Plus,
    PencilSimple,
    Newspaper,
    CheckCircle,
    Clock,
    FileText,
} from "@phosphor-icons/react"

type DigestStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "FAILED"
type PublishDay = "MONDAY" | "WEDNESDAY" | "FRIDAY"

interface Digest {
    id: string
    number: number
    title: string | null
    publishDay: PublishDay
    status: DigestStatus
    publishDate: string
    leeApproved: boolean
    hannaApproved: boolean
}

interface DigestStats {
    total: number
    published: number
    inReview: number
    drafts: number
}

const STATUS_BADGE: Record<DigestStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
    DRAFT: { label: "Draft", variant: "secondary" },
    IN_REVIEW: { label: "In Review", variant: "outline", className: "border-yellow-500/30 bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400" },
    APPROVED: { label: "Approved", variant: "outline", className: "border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
    PUBLISHED: { label: "Published", variant: "outline", className: "border-green-500/30 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" },
    FAILED: { label: "Failed", variant: "destructive" },
}

const DAY_LABELS: Record<PublishDay, string> = {
    MONDAY: "Monday",
    WEDNESDAY: "Wednesday",
    FRIDAY: "Friday",
}

export default function AdminDigestsPage() {
    const { data: session, isPending } = useSession()
    const [digests, setDigests] = useState<Digest[]>([])
    const [stats, setStats] = useState<DigestStats>({ total: 0, published: 0, inReview: 0, drafts: 0 })
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("all")
    const [dayFilter, setDayFilter] = useState("all")

    const fetchDigests = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (statusFilter !== "all") params.set("status", statusFilter)
            if (dayFilter !== "all") params.set("day", dayFilter)

            const res = await fetch(`/api/admin/digests?${params.toString()}`)
            if (!res.ok) throw new Error("Failed to fetch digests")
            const data = await res.json()

            setDigests(data.digests ?? [])
            if (data.stats) {
                setStats(data.stats)
            }
        } catch (error) {
            toast.error("Failed to load digests")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session?.user.role === "admin") {
            fetchDigests()
        }
    }, [session, statusFilter, dayFilter])

    if (isPending) {
        return (
            <div className="flex items-center justify-center min-h-screen text-xs">
                <CircleNotch className="h-4 w-4 animate-spin text-primary" />
            </div>
        )
    }

    if (!session) return <RedirectToSignIn />
    if (session.user.role !== "admin") return <Unauthorized />

    const renderStatusBadge = (status: DigestStatus) => {
        const config = STATUS_BADGE[status]
        return (
            <Badge variant={config.variant} className={`text-[10px] py-0 px-1.5 font-normal ${config.className ?? ""}`}>
                {config.label}
            </Badge>
        )
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Digest Management</h1>
                    <p className="text-muted-foreground text-xs">Create and manage FBM email digests.</p>
                </div>
                <Link href="/admin/digests/create">
                    <Button className="text-xs">
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Create Digest
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Total Digests</CardTitle>
                        <Newspaper className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{stats.total}</p>}
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Published</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{stats.published}</p>}
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">In Review</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{stats.inReview}</p>}
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Drafts</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{stats.drafts}</p>}
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px] text-xs">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="PUBLISHED">Published</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={dayFilter} onValueChange={setDayFilter}>
                            <SelectTrigger className="w-[160px] text-xs">
                                <SelectValue placeholder="Filter by day" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Days</SelectItem>
                                <SelectItem value="MONDAY">Monday</SelectItem>
                                <SelectItem value="WEDNESDAY">Wednesday</SelectItem>
                                <SelectItem value="FRIDAY">Friday</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-md border border-muted/50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/30 text-xs">
                                <TableRow>
                                    <TableHead className="w-[60px]">#</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Day</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Lee</TableHead>
                                    <TableHead className="text-center">Hanna</TableHead>
                                    <TableHead>Publish Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="text-xs">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : digests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                            No digests found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    digests.map((digest) => (
                                        <TableRow key={digest.id}>
                                            <TableCell className="font-medium">{digest.number}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                {digest.title || <span className="text-muted-foreground italic">Untitled</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                                                    {DAY_LABELS[digest.publishDay]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{renderStatusBadge(digest.status)}</TableCell>
                                            <TableCell className="text-center">
                                                <input type="checkbox" checked={digest.leeApproved} readOnly className="pointer-events-none h-3.5 w-3.5" />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <input type="checkbox" checked={digest.hannaApproved} readOnly className="pointer-events-none h-3.5 w-3.5" />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(digest.publishDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/admin/digests/${digest.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <PencilSimple className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
