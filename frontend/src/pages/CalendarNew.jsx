import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, isWeekend, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from '../lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const priorityColors = {
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-blue-500',
    5: 'bg-gray-500',
};

export default function Calendar() {
    const [assignments, setAssignments] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
        fetchHolidays();
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

    const fetchHolidays = async () => {
        try {
            const response = await axios.get('/api/holidays');
            setHolidays(response.data);
            console.log('🎉 Holidays loaded:', response.data);
            console.log('🎉 Holiday dates:', response.data.map(h => h.date));
        } catch (error) {
            console.error('Error loading holidays:', error);
        }
    };

    const fetchAssignments = async () => {
        if (!selectedUser) return;

        try {
            // Get the full range of days shown in calendar (including prev/next month days)
            const start = startOfWeek(startOfMonth(currentDate), { locale: es });
            const end = endOfWeek(endOfMonth(currentDate), { locale: es });

            const startDate = format(start, 'yyyy-MM-dd');
            const endDate = format(end, 'yyyy-MM-dd');

            console.log('Fetching assignments for user:', selectedUser, 'from', startDate, 'to', endDate);

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

    const getHolidayForDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return holidays.find(holiday => {
            const holidayDateStr = holiday.date ? holiday.date.split('T')[0] : '';
            return holidayDateStr === dateStr;
        });
    };

    const isHoliday = (date) => {
        return getHolidayForDate(date) !== undefined;
    };

    const getAssignmentsForDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const filtered = assignments.filter(assignment => {
            // Normalize both dates to compare
            const assignmentDate = assignment.date ? assignment.date.split('T')[0] : '';
            return assignmentDate === dateStr;
        });
        return filtered;
    };

    const getDaysInMonth = () => {
        const start = startOfWeek(startOfMonth(currentDate), { locale: es });
        const end = endOfWeek(endOfMonth(currentDate), { locale: es });
        return eachDayOfInterval({ start, end });
    };

    const handlePrevMonth = () => {
        setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        return `${hours}:${minutes}`;
    };

    const days = getDaysInMonth();
    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    if (loading) {
        return <div className="flex items-center justify-center h-64">Cargando...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
                    <p className="text-muted-foreground">
                        Visualiza las asignaciones de tickets por usuario
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Select
                        value={selectedUser?.toString()}
                        onValueChange={(value) => setSelectedUser(parseInt(value))}
                    >
                        <SelectTrigger className="w-[200px]">
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

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleToday}>
                                Hoy
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleNextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <h2 className="text-xl font-semibold capitalize">
                            {format(currentDate, 'MMMM yyyy', { locale: es })}
                        </h2>
                        <div className="w-[100px]"></div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Week Days Header */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {weekDays.map((day) => (
                            <div key={day} className="text-center font-semibold text-sm py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2">
                        {days.map((day, index) => {
                            const dayAssignments = getAssignmentsForDate(day);
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const isToday = isSameDay(day, new Date());
                            const holiday = getHolidayForDate(day);
                            const isHolidayDay = holiday !== undefined;
                            const isWeekendDay = isWeekend(day);

                            return (
                                <div
                                    key={index}
                                    className={`
                                        min-h-[120px] p-2 border rounded-lg cursor-pointer transition-colors
                                        ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900 opacity-50' :
                                          isHolidayDay ? 'bg-red-50 dark:bg-red-950/20' :
                                          isWeekendDay ? 'bg-gray-100 dark:bg-gray-900' :
                                          'bg-white dark:bg-gray-950'}
                                        ${isToday ? 'ring-2 ring-blue-500' : ''}
                                        hover:bg-gray-50 dark:hover:bg-gray-900
                                    `}
                                    onClick={() => setSelectedDate(day)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`
                                            text-sm font-medium
                                            ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}
                                            ${!isCurrentMonth ? 'text-gray-400' : ''}
                                        `}>
                                            {format(day, 'd')}
                                        </span>
                                        {isHolidayDay && (
                                            <span className="text-base">🎉</span>
                                        )}
                                    </div>

                                    {/* Holiday Name */}
                                    {isHolidayDay && (
                                        <div className="mb-1">
                                            <div className="text-xs font-semibold text-red-600 dark:text-red-400 truncate">
                                                {holiday.name}
                                            </div>
                                        </div>
                                    )}

                                    {/* Assignments */}
                                    <div className="space-y-1">
                                        {dayAssignments.slice(0, 3).map((assignment, idx) => {
                                            const ticket = assignment.ticket || {};
                                            const priority = ticket.priority || 3;
                                            const title = ticket.title || 'Sin título';
                                            const startTime = assignment.start_time || '';
                                            const endTime = assignment.end_time || '';

                                            return (
                                                <div
                                                    key={assignment.id || idx}
                                                    className={`
                                                        text-xs p-1 rounded text-white truncate
                                                        ${priorityColors[priority] || 'bg-gray-500'}
                                                    `}
                                                    title={`${title} (${formatTime(startTime)} - ${formatTime(endTime)})`}
                                                >
                                                    <div className="font-medium truncate">
                                                        {title}
                                                    </div>
                                                    <div className="text-white/80">
                                                        {formatTime(startTime)} - {formatTime(endTime)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {dayAssignments.length > 3 && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                +{dayAssignments.length - 3} más
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Legend */}
            <Card>
                <CardHeader>
                    <CardTitle>Leyenda</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium mb-2">Prioridades:</p>
                            <div className="space-y-2">
                                {[
                                    { priority: 1, label: 'Muy Alta' },
                                    { priority: 2, label: 'Alta' },
                                    { priority: 3, label: 'Media' },
                                    { priority: 4, label: 'Baja' },
                                    { priority: 5, label: 'Muy Baja' },
                                ].map(({ priority, label }) => (
                                    <div key={priority} className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded ${priorityColors[priority]}`} />
                                        <span className="text-sm">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-2">Indicadores:</p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded ring-2 ring-blue-500" />
                                    <span className="text-sm">Día actual</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-red-50 dark:bg-red-950/20 border" />
                                    <span className="text-sm">Feriado 🎉</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-900 border" />
                                    <span className="text-sm">Fin de semana</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                        <p>Total de asignaciones este mes: <strong>{assignments.length}</strong></p>
                        <p>Total de feriados configurados: <strong>{holidays.length}</strong></p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
