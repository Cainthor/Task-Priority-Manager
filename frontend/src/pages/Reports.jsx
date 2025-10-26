import { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useToast } from '../hooks/use-toast';
import { Label } from '../components/ui/label';

export default function Reports() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const priorityColors = {
        1: 'bg-red-100 text-red-800',
        2: 'bg-orange-100 text-orange-800',
        3: 'bg-yellow-100 text-yellow-800',
        4: 'bg-blue-100 text-blue-800',
        5: 'bg-gray-100 text-gray-800',
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchAssignments();
        }
    }, [selectedUser]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users');
            setUsers(response.data);
            if (response.data.length > 0) {
                setSelectedUser(response.data[0].id);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al cargar usuarios',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignments = async () => {
        if (!selectedUser) return;

        try {
            // Get assignments for the last 3 months and next 3 months
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 3);
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3);

            const response = await axios.get('/api/assignments', {
                params: {
                    user_id: selectedUser,
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                },
            });

            setAssignments(response.data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al cargar asignaciones',
                variant: 'destructive',
            });
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        return `${hours}:${minutes}`;
    };

    const getPriorityLabel = (priority) => {
        const labels = {
            1: 'Muy Alta',
            2: 'Alta',
            3: 'Media',
            4: 'Baja',
            5: 'Muy Baja',
        };
        return labels[priority] || 'Desconocida';
    };

    const getStatusLabel = (status) => {
        const labels = {
            pending: 'Pendiente',
            in_progress: 'En Progreso',
            completed: 'Completado',
            cancelled: 'Cancelado',
        };
        return labels[status] || status;
    };

    // Group assignments by ticket
    const groupedAssignments = assignments.reduce((acc, assignment) => {
        const ticketId = assignment.ticket.id;
        if (!acc[ticketId]) {
            acc[ticketId] = {
                ticket: assignment.ticket,
                assignments: [],
                totalHours: 0,
            };
        }
        acc[ticketId].assignments.push(assignment);
        acc[ticketId].totalHours += parseFloat(assignment.hours);
        return acc;
    }, {});

    const totalHours = assignments.reduce((sum, a) => sum + parseFloat(a.hours), 0);

    if (loading) {
        return <div className="flex items-center justify-center h-64">Cargando...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
                <p className="text-muted-foreground">
                    Visualiza todas las asignaciones por usuario
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Selecciona un Usuario</CardTitle>
                            <CardDescription>Ver todas las asignaciones del usuario</CardDescription>
                        </div>
                        <div className="w-[250px]">
                            <Select
                                value={selectedUser?.toString()}
                                onValueChange={(value) => setSelectedUser(parseInt(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona usuario" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((user) => (
                                        <SelectItem key={user.id} value={user.id.toString()}>
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <p className="text-sm font-medium">
                            Total de horas asignadas: <span className="text-lg font-bold">{totalHours.toFixed(2)}h</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Mostrando últimos 3 meses y próximos 3 meses
                        </p>
                    </div>

                    {Object.keys(groupedAssignments).length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No hay asignaciones para este usuario
                        </p>
                    ) : (
                        <div className="space-y-6">
                            {Object.values(groupedAssignments).map(({ ticket, assignments: ticketAssignments, totalHours }) => (
                                <div key={ticket.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">{ticket.title}</h3>
                                            {ticket.description && (
                                                <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${priorityColors[ticket.priority]}`}>
                                                {getPriorityLabel(ticket.priority)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Total del Ticket:</span>
                                            <span className="font-medium ml-2">{ticket.total_hours}h</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Fecha Inicio:</span>
                                            <span className="font-medium ml-2">
                                                {ticket.start_date ? formatDate(ticket.start_date) : '-'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Fecha Término:</span>
                                            <span className="font-medium ml-2">
                                                {ticket.calculated_end_date ? formatDate(ticket.calculated_end_date) : '-'}
                                            </span>
                                        </div>
                                    </div>

                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Hora Inicio</TableHead>
                                                <TableHead>Hora Fin</TableHead>
                                                <TableHead>Horas</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ticketAssignments
                                                .sort((a, b) => new Date(a.date) - new Date(b.date))
                                                .map((assignment) => (
                                                    <TableRow key={assignment.id}>
                                                        <TableCell>{formatDate(assignment.date)}</TableCell>
                                                        <TableCell>{formatTime(assignment.start_time)}</TableCell>
                                                        <TableCell>{formatTime(assignment.end_time)}</TableCell>
                                                        <TableCell>{assignment.hours}h</TableCell>
                                                    </TableRow>
                                                ))}
                                            <TableRow className="font-semibold bg-muted/50">
                                                <TableCell colSpan={3} className="text-right">Total asignado:</TableCell>
                                                <TableCell>{totalHours.toFixed(2)}h</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
