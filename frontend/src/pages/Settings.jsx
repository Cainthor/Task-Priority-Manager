import { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import { Plus, Trash2, Save, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export default function Settings() {
    const [settings, setSettings] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [holidayToDelete, setHolidayToDelete] = useState(null);
    const [syncDialogOpen, setSyncDialogOpen] = useState(false);
    const [syncYear, setSyncYear] = useState(new Date().getFullYear().toString());
    const [syncCountry, setSyncCountry] = useState('CL');
    const [syncing, setSyncing] = useState(false);
    const { toast } = useToast();

    // Form state for new holiday
    const [newHoliday, setNewHoliday] = useState({
        date: '',
        name: '',
        description: '',
        is_recurring: false,
    });

    useEffect(() => {
        fetchSettings();
        fetchHolidays();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get('/api/settings');
            setSettings(response.data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al cargar configuraciones',
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
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al cargar feriados',
                variant: 'destructive',
            });
        }
    };

    const handleSettingChange = (key, value) => {
        setSettings(settings.map(s =>
            s.key === key ? { ...s, value } : s
        ));
    };

    const saveSetting = async (setting) => {
        try {
            await axios.put(`/api/settings/${setting.key}`, {
                value: setting.value,
            });
            toast({
                title: 'Éxito',
                description: 'Configuración actualizada correctamente',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al actualizar configuración',
                variant: 'destructive',
            });
        }
    };

    const handleAddHoliday = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/holidays', newHoliday);
            toast({
                title: 'Éxito',
                description: 'Feriado agregado correctamente',
            });
            fetchHolidays();
            setDialogOpen(false);
            setNewHoliday({
                date: '',
                name: '',
                description: '',
                is_recurring: false,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al agregar feriado',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteHoliday = (holiday) => {
        setHolidayToDelete(holiday);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/api/holidays/${holidayToDelete.id}`);
            toast({
                title: 'Éxito',
                description: 'Feriado eliminado correctamente',
            });
            fetchHolidays();
            setDeleteDialogOpen(false);
            setHolidayToDelete(null);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al eliminar feriado',
                variant: 'destructive',
            });
        }
    };

    const handleSyncHolidays = async () => {
        setSyncing(true);
        try {
            await axios.post('/api/holidays/sync', {
                year: parseInt(syncYear),
                country: syncCountry,
            });
            toast({
                title: 'Éxito',
                description: 'Feriados sincronizados correctamente',
            });
            fetchHolidays();
            setSyncDialogOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al sincronizar feriados',
                variant: 'destructive',
            });
        } finally {
            setSyncing(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configuraciones</h1>
                <p className="text-muted-foreground">
                    Gestiona la configuración del sistema y feriados
                </p>
            </div>

            {/* Work Hours Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Horarios Laborales</CardTitle>
                    <CardDescription>
                        Define el horario de trabajo para la asignación de tickets
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {settings.filter(s => s.key.includes('hour')).map((setting) => (
                        <div key={setting.key} className="flex items-center gap-4">
                            <div className="flex-1">
                                <Label htmlFor={setting.key}>{setting.description}</Label>
                                <Input
                                    id={setting.key}
                                    type="time"
                                    value={setting.value}
                                    onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={() => saveSetting(setting)}
                                size="sm"
                                className="mt-6"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Guardar
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Holidays */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Feriados</CardTitle>
                            <CardDescription>
                                Gestiona los días feriados (no se asignarán tickets en estos días)
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setSyncDialogOpen(true)}>
                                <Download className="mr-2 h-4 w-4" />
                                Sincronizar desde API
                            </Button>
                            <Button onClick={() => setDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar Manual
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {holidays.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No hay feriados configurados</p>
                        ) : (
                            holidays.map((holiday) => (
                                <div
                                    key={holiday.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">{holiday.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDate(holiday.date)}
                                            {holiday.is_recurring && ' (Se repite cada año)'}
                                        </p>
                                        {holiday.description && (
                                            <p className="text-sm text-muted-foreground">{holiday.description}</p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteHoliday(holiday)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Add Holiday Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Agregar Feriado</DialogTitle>
                        <DialogDescription>
                            Configura un nuevo día feriado
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddHoliday} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="holiday_name">Nombre del Feriado</Label>
                            <Input
                                id="holiday_name"
                                value={newHoliday.name}
                                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                                placeholder="Ej: Navidad"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="holiday_date">Fecha</Label>
                            <Input
                                id="holiday_date"
                                type="date"
                                value={newHoliday.date}
                                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="holiday_description">Descripción (opcional)</Label>
                            <textarea
                                id="holiday_description"
                                value={newHoliday.description}
                                onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                                placeholder="Descripción del feriado"
                                className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is_recurring"
                                checked={newHoliday.is_recurring}
                                onChange={(e) => setNewHoliday({ ...newHoliday, is_recurring: e.target.checked })}
                                className="rounded border-gray-300"
                            />
                            <Label htmlFor="is_recurring" className="text-sm font-normal">
                                Se repite cada año (ej: Navidad, Año Nuevo)
                            </Label>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                Agregar
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Sync Holidays Dialog */}
            <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sincronizar Feriados desde API</DialogTitle>
                        <DialogDescription>
                            Obtén feriados oficiales desde Nager.Date API (230+ países)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sync_year">Año</Label>
                            <Select value={syncYear} onValueChange={setSyncYear}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[2024, 2025, 2026, 2027].map(year => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sync_country">País</Label>
                            <Select value={syncCountry} onValueChange={setSyncCountry}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CL">Chile</SelectItem>
                                    <SelectItem value="AR">Argentina</SelectItem>
                                    <SelectItem value="BR">Brasil</SelectItem>
                                    <SelectItem value="PE">Perú</SelectItem>
                                    <SelectItem value="CO">Colombia</SelectItem>
                                    <SelectItem value="MX">México</SelectItem>
                                    <SelectItem value="ES">España</SelectItem>
                                    <SelectItem value="US">Estados Unidos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSyncDialogOpen(false)}
                                disabled={syncing}
                            >
                                Cancelar
                            </Button>
                            <Button onClick={handleSyncHolidays} disabled={syncing}>
                                {syncing ? 'Sincronizando...' : 'Sincronizar'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará el feriado "{holidayToDelete?.name}". Esta acción no se puede deshacer.
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
        </div>
    );
}
