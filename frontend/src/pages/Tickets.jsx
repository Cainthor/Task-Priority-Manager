import { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useToast } from '../hooks/use-toast';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';

export default function Tickets() {
    const [tickets, setTickets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState(null);
    const [availabilityDialog, setAvailabilityDialog] = useState({ open: false, message: '', severity: 'info', pendingData: null });
    const { toast } = useToast();
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

    const priorityColors = {
        1: 'bg-red-100 text-red-800',
        2: 'bg-orange-100 text-orange-800',
        3: 'bg-yellow-100 text-yellow-800',
        4: 'bg-blue-100 text-blue-800',
        5: 'bg-gray-100 text-gray-800',
    };

    const statusColors = {
        pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
        in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        stopped: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };

    useEffect(() => {
        fetchTickets();
        fetchUsers();
    }, []);

    const fetchTickets = async () => {
        try {
            const response = await axios.get('/api/tickets');
            setTickets(response.data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al cargar tickets',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const checkAvailability = async (data) => {
        try {
            const response = await axios.post('/api/check-availability', {
                user_id: parseInt(data.user_id),
                start_date: data.start_date,
                total_hours: parseFloat(data.total_hours),
            });

            if (response.data.has_full_days || response.data.has_warnings) {
                // Show confirmation dialog instead of just toast
                return new Promise((resolve) => {
                    setAvailabilityDialog({
                        open: true,
                        message: response.data.message,
                        severity: response.data.severity,
                        pendingData: data,
                        onConfirm: () => {
                            setAvailabilityDialog({ open: false, message: '', severity: 'info', pendingData: null });
                            resolve(true);
                        },
                        onCancel: () => {
                            setAvailabilityDialog({ open: false, message: '', severity: 'info', pendingData: null });
                            resolve(false);
                        }
                    });
                });
            }

            return true;
        } catch (error) {
            console.error('Error checking availability:', error);
            return true; // Continue anyway
        }
    };

    const onSubmit = async (data) => {
        try {
            if (editingTicket) {
                const updateData = {
                    title: data.title,
                    description: data.description,
                    priority: parseInt(data.priority),
                    status: data.status,
                };

                // Add total_hours if provided (will trigger recalculation if changed)
                if (data.total_hours) {
                    updateData.total_hours = parseFloat(data.total_hours);
                }

                // Add new_user_id if user wants to reassign
                if (data.new_user_id) {
                    updateData.new_user_id = parseInt(data.new_user_id);
                }

                await axios.put(`/api/tickets/${editingTicket.id}`, updateData);

                let description = 'Ticket actualizado correctamente';
                if (data.new_user_id) {
                    description = 'Ticket actualizado y reasignado. El calendario ha sido recalculado.';
                } else if (data.total_hours && parseFloat(data.total_hours) !== editingTicket.total_hours) {
                    description = 'Ticket actualizado. Las horas han cambiado y el calendario ha sido optimizado.';
                } else if (parseInt(data.priority) !== editingTicket.priority) {
                    description = 'Ticket actualizado. La prioridad ha cambiado y el calendario ha sido recalculado.';
                }

                toast({
                    title: 'Éxito',
                    description: description,
                });
            } else {
                if (!data.priority || !data.user_id || !data.start_date) {
                    toast({
                        title: 'Error',
                        description: 'Por favor completa todos los campos requeridos',
                        variant: 'destructive',
                    });
                    return;
                }

                // Check availability before creating ticket
                const shouldContinue = await checkAvailability(data);

                if (!shouldContinue) {
                    // User cancelled after seeing availability warning
                    return;
                }

                await axios.post('/api/tickets', {
                    title: data.title,
                    description: data.description,
                    priority: parseInt(data.priority),
                    total_hours: parseFloat(data.total_hours),
                    user_id: parseInt(data.user_id),
                    start_date: data.start_date,
                    buffer_days: data.buffer_days ? parseInt(data.buffer_days) : 0,
                });
                toast({
                    title: 'Éxito',
                    description: 'Ticket creado correctamente',
                });
            }
            fetchTickets();
            setDialogOpen(false);
            reset();
            setEditingTicket(null);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al guardar ticket',
                variant: 'destructive',
            });
        }
    };

    const handleEdit = (ticket) => {
        setEditingTicket(ticket);
        setValue('title', ticket.title);
        setValue('description', ticket.description);
        setValue('priority', ticket.priority.toString());
        setValue('status', ticket.status);
        setValue('total_hours', ticket.total_hours);
        setDialogOpen(true);
    };

    const handleDelete = (ticket) => {
        setTicketToDelete(ticket);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/api/tickets/${ticketToDelete.id}`);
            toast({
                title: 'Éxito',
                description: 'Ticket eliminado correctamente',
            });
            fetchTickets();
            setDeleteDialogOpen(false);
            setTicketToDelete(null);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al eliminar ticket',
                variant: 'destructive',
            });
        }
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setEditingTicket(null);
        reset({
            title: '',
            description: '',
            priority: '3',
            total_hours: '',
            user_id: '',
            status: 'pending',
        });
    };

    const handleNewTicket = () => {
        reset({
            title: '',
            description: '',
            priority: '3',
            total_hours: '',
            user_id: '',
            start_date: new Date().toISOString().split('T')[0],
        });
        setEditingTicket(null);
        setDialogOpen(true);
    };

    const getPriorityLabel = (priority) => {
        const labels = {
            1: 'Muy Alta',
            2: 'Alta',
            3: 'Media',
            4: 'Baja',
            5: 'Muy Baja',
        };
        return labels[priority] || priority;
    };

    const getStatusLabel = (status) => {
        const labels = {
            pending: 'Pendiente',
            in_progress: 'En Progreso',
            completed: 'Completado',
            cancelled: 'Cancelado',
            stopped: 'Detenido',
        };
        return labels[status] || status;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            // Parse as local date to avoid timezone issues
            const [year, month, day] = dateString.split('-');
            if (!year || !month || !day) return '-';
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('es-ES');
        } catch (error) {
            console.error('Error formatting date:', dateString, error);
            return '-';
        }
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
                    <p className="text-muted-foreground">
                        Gestiona los tickets del sistema
                    </p>
                </div>
                <Button onClick={handleNewTicket}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Ticket
                </Button>

                <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingTicket ? 'Editar Ticket' : 'Crear Nuevo Ticket'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingTicket
                                    ? 'Actualiza la información del ticket'
                                    : 'Completa el formulario para crear un nuevo ticket'
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título</Label>
                                <Input
                                    id="title"
                                    {...register('title', { required: 'El título es requerido' })}
                                    placeholder="Título del ticket"
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-500">{errors.title.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea
                                    id="description"
                                    {...register('description')}
                                    placeholder="Descripción del ticket"
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority">Prioridad</Label>
                                <input type="hidden" {...register('priority', { required: true })} />
                                <Select
                                    onValueChange={(value) => setValue('priority', value)}
                                    defaultValue={editingTicket?.priority?.toString() || '3'}
                                    value={watch('priority') || (editingTicket?.priority?.toString() || '3')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona prioridad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Muy Alta</SelectItem>
                                        <SelectItem value="2">Alta</SelectItem>
                                        <SelectItem value="3">Media</SelectItem>
                                        <SelectItem value="4">Baja</SelectItem>
                                        <SelectItem value="5">Muy Baja</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {editingTicket && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Estado</Label>
                                        <input type="hidden" {...register('status', { required: true })} />
                                        <Select
                                            onValueChange={(value) => setValue('status', value)}
                                            defaultValue={editingTicket?.status || 'pending'}
                                            value={watch('status') || editingTicket?.status}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona estado" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pendiente</SelectItem>
                                                <SelectItem value="in_progress">En Progreso</SelectItem>
                                                <SelectItem value="completed">Completado</SelectItem>
                                                <SelectItem value="cancelled">Cancelado</SelectItem>
                                                <SelectItem value="stopped">Detenido</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="total_hours">Horas Totales</Label>
                                        <Input
                                            id="total_hours"
                                            type="number"
                                            step="0.5"
                                            {...register('total_hours', {
                                                min: { value: 0.5, message: 'Mínimo 0.5 horas' }
                                            })}
                                            placeholder="Ej: 8"
                                            defaultValue={editingTicket?.total_hours}
                                        />
                                        {errors.total_hours && (
                                            <p className="text-sm text-red-500">{errors.total_hours.message}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Si cambias las horas o la prioridad, se recalcularán las asignaciones
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="new_user_id">Reasignar a (opcional)</Label>
                                        <input type="hidden" {...register('new_user_id')} />
                                        <Select
                                            onValueChange={(value) => setValue('new_user_id', value)}
                                            value={watch('new_user_id')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona para reasignar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map((user) => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.name} ({user.email})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Si seleccionas un nuevo usuario, se recalcularán todas las asignaciones
                                        </p>
                                    </div>
                                </>
                            )}

                            {!editingTicket && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="start_date">Fecha de Inicio</Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            {...register('start_date', {
                                                required: !editingTicket ? 'La fecha de inicio es requerida' : false
                                            })}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                        {errors.start_date && (
                                            <p className="text-sm text-red-500">{errors.start_date.message}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            A partir de esta fecha se asignarán las horas
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="total_hours_create">Horas Totales</Label>
                                        <Input
                                            id="total_hours_create"
                                            type="number"
                                            step="0.5"
                                            {...register('total_hours', {
                                                required: !editingTicket ? 'Las horas son requeridas' : false,
                                                min: { value: 0.5, message: 'Mínimo 0.5 horas' }
                                            })}
                                            placeholder="Ej: 8"
                                        />
                                        {errors.total_hours && (
                                            <p className="text-sm text-red-500">{errors.total_hours.message}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Prioridad Muy Alta: hasta 8h/día. Otras prioridades: 4h/día máximo
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="buffer_days">Días Buffer (opcional)</Label>
                                        <Input
                                            id="buffer_days"
                                            type="number"
                                            min="0"
                                            {...register('buffer_days')}
                                            placeholder="0"
                                            defaultValue="0"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Días adicionales después de la última asignación para la fecha de término
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="user_id">Asignar a Usuario</Label>
                                        <input type="hidden" {...register('user_id', { required: !editingTicket })} />
                                        <Select
                                            onValueChange={(value) => setValue('user_id', value)}
                                            value={watch('user_id')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona usuario" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map((user) => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.name} ({user.email})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={handleDialogClose}>
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    {editingTicket ? 'Actualizar' : 'Crear'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Tickets</CardTitle>
                    <CardDescription>
                        Todos los tickets del sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table className="min-w-[800px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Prioridad</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Asignado a</TableHead>
                                <TableHead>Horas Totales</TableHead>
                                <TableHead>Fecha Inicio</TableHead>
                                <TableHead>Fecha Término</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center">
                                        No hay tickets registrados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tickets.map((ticket) => {
                                    const assignedUser = ticket.assignments && ticket.assignments.length > 0
                                        ? ticket.assignments[0].user
                                        : null;

                                    return (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium">{ticket.title}</TableCell>
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
                                        <TableCell>{assignedUser?.name || '-'}</TableCell>
                                        <TableCell>{ticket.total_hours}h</TableCell>
                                        <TableCell>
                                            {formatDate(ticket.start_date)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(ticket.calculated_end_date)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(ticket)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(ticket)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el ticket y todas sus asignaciones.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Availability Warning Dialog */}
            <AlertDialog open={availabilityDialog.open} onOpenChange={(open) => {
                if (!open && availabilityDialog.onCancel) {
                    availabilityDialog.onCancel();
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {availabilityDialog.severity === 'error' ? '⚠️ Advertencia de Disponibilidad' : 'ℹ️ Información'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="whitespace-pre-line">
                            {availabilityDialog.message}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={availabilityDialog.onCancel}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={availabilityDialog.onConfirm}>
                            Continuar de todos modos
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
