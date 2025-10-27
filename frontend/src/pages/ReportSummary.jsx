import { useState, useEffect, useMemo } from 'react';
import axios from '../lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useToast } from '../hooks/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ReportSummary() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const { toast } = useToast();

    const priorityColors = {
        1: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        2: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        3: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        4: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        5: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    };

    const statusColors = {
        pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
        in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
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
            setCurrentPage(1); // Reset to first page when data changes
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

    // Group assignments by ticket and calculate summary
    const ticketSummary = useMemo(() => {
        const grouped = assignments.reduce((acc, assignment) => {
            const ticketId = assignment.ticket.id;
            if (!acc[ticketId]) {
                acc[ticketId] = {
                    id: assignment.ticket.id,
                    title: assignment.ticket.title,
                    description: assignment.ticket.description,
                    priority: assignment.ticket.priority,
                    status: assignment.ticket.status,
                    totalHours: assignment.ticket.total_hours,
                    assignedHours: 0,
                    assignmentsCount: 0,
                    startDate: assignment.ticket.start_date,
                    endDate: assignment.ticket.calculated_end_date,
                };
            }
            acc[ticketId].assignedHours += parseFloat(assignment.hours);
            acc[ticketId].assignmentsCount += 1;
            return acc;
        }, {});

        return Object.values(grouped);
    }, [assignments]);

    // Apply filters
    const filteredData = useMemo(() => {
        return ticketSummary.filter(ticket => {
            const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (ticket.description && ticket.description.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesPriority = priorityFilter === 'all' || ticket.priority === parseInt(priorityFilter);
            const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

            return matchesSearch && matchesPriority && matchesStatus;
        });
    }, [ticketSummary, searchTerm, priorityFilter, statusFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredData.slice(start, end);
    }, [filteredData, currentPage, itemsPerPage]);

    const totalHours = filteredData.reduce((sum, ticket) => sum + ticket.assignedHours, 0);

    const exportToExcel = () => {
        if (filteredData.length === 0) {
            toast({
                title: 'Sin datos',
                description: 'No hay datos para exportar',
                variant: 'destructive',
            });
            return;
        }

        const userName = users.find(u => u.id === selectedUser)?.name || 'Usuario';

        // Prepare data
        const data = filteredData.map(ticket => ({
            Ticket: ticket.title,
            Descripción: ticket.description || '-',
            Prioridad: getPriorityLabel(ticket.priority),
            Estado: getStatusLabel(ticket.status),
            'Horas Totales': ticket.totalHours,
            'Horas Asignadas': ticket.assignedHours.toFixed(2),
            'Num. Asignaciones': ticket.assignmentsCount,
            'Fecha Inicio': ticket.startDate ? formatDate(ticket.startDate) : '-',
            'Fecha Término': ticket.endDate ? formatDate(ticket.endDate) : '-',
        }));

        // Add total row
        data.push({
            Ticket: '',
            Descripción: '',
            Prioridad: '',
            Estado: '',
            'Horas Totales': '',
            'Horas Asignadas': totalHours.toFixed(2),
            'Num. Asignaciones': filteredData.reduce((sum, t) => sum + t.assignmentsCount, 0),
            'Fecha Inicio': '',
            'Fecha Término': 'TOTAL',
        });

        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Set column widths
        ws['!cols'] = [
            { wch: 30 }, // Ticket
            { wch: 40 }, // Descripción
            { wch: 12 }, // Prioridad
            { wch: 12 }, // Estado
            { wch: 12 }, // Horas Totales
            { wch: 12 }, // Horas Asignadas
            { wch: 15 }, // Num. Asignaciones
            { wch: 12 }, // Fecha Inicio
            { wch: 12 }, // Fecha Término
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Reporte Resumido');

        // Save file
        const fileName = `Reporte_Resumido_${userName}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        toast({
            title: 'Éxito',
            description: 'Reporte exportado correctamente',
        });
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Cargando...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Reporte Resumido</CardTitle>
                            <CardDescription>Resumen de tickets y horas asignadas por usuario</CardDescription>
                        </div>
                        <Button onClick={exportToExcel} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Exportar a Excel
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Usuario</label>
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

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar ticket..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Prioridad</label>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="1">Muy Alta</SelectItem>
                                    <SelectItem value="2">Alta</SelectItem>
                                    <SelectItem value="3">Media</SelectItem>
                                    <SelectItem value="4">Baja</SelectItem>
                                    <SelectItem value="5">Muy Baja</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Estado</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="pending">Pendiente</SelectItem>
                                    <SelectItem value="in_progress">En Progreso</SelectItem>
                                    <SelectItem value="completed">Completado</SelectItem>
                                    <SelectItem value="cancelled">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Total Tickets</p>
                            <p className="text-2xl font-bold">{filteredData.length}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Total Asignaciones</p>
                            <p className="text-2xl font-bold">
                                {filteredData.reduce((sum, t) => sum + t.assignmentsCount, 0)}
                            </p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Total Horas</p>
                            <p className="text-2xl font-bold">{totalHours.toFixed(2)}h</p>
                        </div>
                    </div>

                    {/* Data Table */}
                    {filteredData.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No hay datos que coincidan con los filtros
                        </p>
                    ) : (
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ticket</TableHead>
                                            <TableHead>Prioridad</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Horas Totales</TableHead>
                                            <TableHead className="text-right">Horas Asignadas</TableHead>
                                            <TableHead className="text-right">Asignaciones</TableHead>
                                            <TableHead>Fecha Inicio</TableHead>
                                            <TableHead>Fecha Término</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedData.map((ticket) => (
                                            <TableRow key={ticket.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{ticket.title}</p>
                                                        {ticket.description && (
                                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                                {ticket.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${priorityColors[ticket.priority]}`}>
                                                        {getPriorityLabel(ticket.priority)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[ticket.status]}`}>
                                                        {getStatusLabel(ticket.status)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {ticket.totalHours}h
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {ticket.assignedHours.toFixed(2)}h
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {ticket.assignmentsCount}
                                                </TableCell>
                                                <TableCell>
                                                    {ticket.startDate ? formatDate(ticket.startDate) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {ticket.endDate ? formatDate(ticket.endDate) : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-muted-foreground">
                                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
                                        {Math.min(currentPage * itemsPerPage, filteredData.length)} de{' '}
                                        {filteredData.length} resultados
                                    </p>
                                    <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                                        setItemsPerPage(parseInt(value));
                                        setCurrentPage(1);
                                    }}>
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">5 / página</SelectItem>
                                            <SelectItem value="10">10 / página</SelectItem>
                                            <SelectItem value="20">20 / página</SelectItem>
                                            <SelectItem value="50">50 / página</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Anterior
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className="w-8 h-8 p-0"
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Siguiente
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
