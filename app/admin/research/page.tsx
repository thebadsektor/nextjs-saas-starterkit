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
    Flask,
    Lightning,
    MagnifyingGlass,
} from "@phosphor-icons/react"

interface ResearchConfig {
    id: string
    name: string
    description: string | null
    searchWindowDays: number
    minFindings: number
    knowledgeBase: { id: string; name: string } | null
    _count: {
        sectionTemplates: number
        runs: number
    }
    createdAt: string
}

interface ResearchStats {
    totalConfigs: number
    activeRuns: number
    totalFindings: number
}

export default function AdminResearchPage() {
    const { data: session, isPending } = useSession()
    const [configs, setConfigs] = useState<ResearchConfig[]>([])
    const [stats, setStats] = useState<ResearchStats>({ totalConfigs: 0, activeRuns: 0, totalFindings: 0 })
    const [loading, setLoading] = useState(true)

    const fetchConfigs = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/research")
            if (!res.ok) throw new Error("Failed to fetch research configs")
            const data = await res.json()

            setConfigs(data.researches ?? data ?? [])
            if (data.stats) {
                setStats(data.stats)
            }
        } catch (error) {
            toast.error("Failed to load research configs")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session?.user.role === "admin") {
            fetchConfigs()
        }
    }, [session])

    if (isPending) {
        return (
            <div className="flex items-center justify-center min-h-screen text-xs">
                <CircleNotch className="h-4 w-4 animate-spin text-primary" />
            </div>
        )
    }

    if (!session) return <RedirectToSignIn />
    if (session.user.role !== "admin") return <Unauthorized />

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Research Configs</h1>
                    <p className="text-muted-foreground text-xs">Manage research pipelines, section templates, and prompts.</p>
                </div>
                <Link href="/admin/research/create">
                    <Button className="text-xs">
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Create Research
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Total Configs</CardTitle>
                        <Flask className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{stats.totalConfigs}</p>}
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Active Runs</CardTitle>
                        <Lightning className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{stats.activeRuns}</p>}
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Total Findings</CardTitle>
                        <MagnifyingGlass className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{stats.totalFindings}</p>}
                    </CardContent>
                </Card>
            </div>

            {/* Research Config Table */}
            <Card className="border-none shadow-sm">
                <CardContent className="pt-6">
                    <div className="rounded-md border border-muted/50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/30 text-xs">
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Knowledge Base</TableHead>
                                    <TableHead className="text-center">Templates</TableHead>
                                    <TableHead className="text-center">Runs</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="text-xs">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : configs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                            No research configs found. Create one to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    configs.map((config) => (
                                        <TableRow key={config.id}>
                                            <TableCell className="font-medium">{config.name}</TableCell>
                                            <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                                {config.description || <span className="italic">--</span>}
                                            </TableCell>
                                            <TableCell>
                                                {config.knowledgeBase ? (
                                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                                                        {config.knowledgeBase.name}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">--</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">{config._count.sectionTemplates}</TableCell>
                                            <TableCell className="text-center">{config._count.runs}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(config.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/admin/research/${config.id}`}>
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
