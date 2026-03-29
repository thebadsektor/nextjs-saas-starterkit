"use client"

import { useSession } from "@/lib/auth-client"
import { RedirectToSignIn } from "@daveyplate/better-auth-ui"
import Unauthorized from "@/components/unauthorized"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CircleNotch, CalendarBlank } from "@phosphor-icons/react"

export default function AdminSchedulePage() {
    const { data: session, isPending } = useSession()

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
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
                <p className="text-muted-foreground text-xs">Manage digest publishing schedule and automation.</p>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CalendarBlank className="h-5 w-5 text-muted-foreground" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Schedule management will be available in a future update. This page will allow you to configure automated publishing schedules, set up recurring research runs, and manage digest delivery timelines.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-10 text-muted-foreground">
                        <div className="text-center space-y-2">
                            <CalendarBlank className="h-10 w-10 mx-auto text-muted-foreground/50" />
                            <p className="text-xs">This feature is under development.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
