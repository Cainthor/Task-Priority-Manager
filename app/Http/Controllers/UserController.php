<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    // Listar todos los usuarios
    public function index()
    {
        $users = User::with('specialty')->get();
        return response()->json($users);
    }

    // Crear un nuevo usuario
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role_type' => 'nullable|in:technical,functional,service_manager',
            'specialty_id' => 'nullable|exists:specialties,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_type' => $request->role_type,
            'specialty_id' => $request->specialty_id,
        ]);

        return response()->json([
            'message' => 'Usuario creado exitosamente',
            'user' => $user->load('specialty')
        ], 201);
    }

    // Mostrar un usuario específico
    public function show($id)
    {
        $user = User::with('specialty')->findOrFail($id);
        return response()->json($user);
    }

    // Actualizar un usuario
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'string|max:255',
            'email' => 'string|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8',
            'role_type' => 'nullable|in:technical,functional,service_manager',
            'specialty_id' => 'nullable|exists:specialties,id',
        ]);

        $user->name = $request->name ?? $user->name;
        $user->email = $request->email ?? $user->email;

        if ($request->has('role_type')) {
            $user->role_type = $request->role_type;
        }

        if ($request->has('specialty_id')) {
            $user->specialty_id = $request->specialty_id;
        }

        if ($request->password) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'message' => 'Usuario actualizado exitosamente',
            'user' => $user->load('specialty')
        ]);
    }

    // Eliminar un usuario
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'message' => 'Usuario eliminado exitosamente'
        ]);
    }
}