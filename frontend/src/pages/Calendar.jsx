import { useState, useEffect, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from '../lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../lib/calendar-custom.css';

const locales = {
    'es': es,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const priorityColors = {
    1: '#ef4444', // red-500
    2: '#f97316', // orange-500
    3: '#eab308', // yellow-500
    4: '#3b82f6', // blue-500
    5: '#6b7280', // gray-500
};

export default function Calendar() {
    const [assignments, setAssignments] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchAssignments();
        }
    }, [selectedUser, currentDate]);

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
            const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
            const endDate = format(endOfMonth(addMonths(currentDate, 1)), 'yyyy-MM-dd');

            console.log('Fetching assignments:', { user_id: selectedUser, startDate, endDate });

            const response = await axios.get('/api/assignments', {
                params: {
                    user_id: selectedUser,
                    start_date: startDate,
                    end_date: endDate,
                },
            });

            console.log('Assignments received:', response.data);
            setAssignments(response.data);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            toast({
                title: 'Error',
                description: 'Error al cargar asignaciones',
                variant: 'destructive',
            });
        }
    };

    const events = useMemo(() => {
        console.log('Converting assignments to events:', assignments);
        const converted = assignments.map((assignment) => {
            const date = new Date(assignment.date + 'T00:00:00');
            const [startHour, startMinute] = assignment.start_time.split(':');
            const [endHour, endMinute] = assignment.end_time.split(':');

            const start = new Date(date);
            start.setHours(parseInt(startHour), parseInt(startMinute), 0);

            const end = new Date(date);
            end.setHours(parseInt(endHour), parseInt(endMinute), 0);

            return {
                id: assignment.id,
                title: assignment.ticket.title,
                start,
                end,
                resource: {
                    ...assignment,
                    color: priorityColors[assignment.ticket.priority] || '#6b7280',
                },
            };
        });
        console.log('Events created:', converted);
        return converted;
    }, [assignments]);

    const handleNavigate = (action) => {
        if (action === 'PREV') {
            setCurrentDate(subMonths(currentDate, 1));
        } else if (action === 'NEXT') {
            setCurrentDate(addMonths(currentDate, 1));
        } else if (action === 'TODAY') {
            setCurrentDate(new Date());
        }
    };

    const eventStyleGetter = (event) => {
        const backgroundColor = event.resource?.color || '#3b82f6';
        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block',
            },
        };
    };

    const CustomToolbar = () => {
        return (
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNavigate('PREV')}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNavigate('TODAY')}
                    >
                        Hoy
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNavigate('NEXT')}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <h2 className="text-xl font-semibold">
                    {format(currentDate, 'MMMM yyyy', { locale: es })}
                </h2>
                <div className="w-[200px]">
                    {selectedUser && (
                        <Select
                            value={selectedUser?.toString()}
                            onValueChange={(value) => setSelectedUser(parseInt(value))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>
        );
    };

    const CustomEvent = ({ event }) => {
        return (
            <div className="text-xs font-medium p-1">
                <div className="font-semibold">{event.title}</div>
                <div className="text-white/80">
                    {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                </div>
            </div>
        );
    };

    const messages = {
        allDay: 'Todo el día',
        previous: 'Anterior',
        next: 'Siguiente',
        today: 'Hoy',
        month: 'Mes',
        week: 'Semana',
        day: 'Día',
        agenda: 'Agenda',
        date: 'Fecha',
        time: 'Hora',
        event: 'Evento',
        noEventsInRange: 'No hay asignaciones en este rango',
        showMore: (total) => `+ Ver más (${total})`,
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
                <p className="text-muted-foreground">
                    Visualiza las asignaciones de tickets por usuario
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Calendario de Asignaciones</CardTitle>
                    <CardDescription>
                        Vista mensual de las asignaciones de tickets
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CustomToolbar />
                    <div style={{ height: '600px' }}>
                        <BigCalendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%' }}
                            culture="es"
                            messages={messages}
                            eventPropGetter={eventStyleGetter}
                            components={{
                                event: CustomEvent,
                            }}
                            views={['month', 'week', 'day']}
                            defaultView="month"
                            step={60}
                            showMultiDayTimes
                            min={new Date(0, 0, 0, 9, 0, 0)}
                            max={new Date(0, 0, 0, 18, 0, 0)}
                            date={currentDate}
                            onNavigate={(date) => setCurrentDate(date)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Leyenda de Prioridades</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 flex-wrap">
                        {[
                            { priority: 1, label: 'Muy Alta' },
                            { priority: 2, label: 'Alta' },
                            { priority: 3, label: 'Media' },
                            { priority: 4, label: 'Baja' },
                            { priority: 5, label: 'Muy Baja' },
                        ].map(({ priority, label }) => (
                            <div key={priority} className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: priorityColors[priority] }}
                                />
                                <span className="text-sm">{label}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
