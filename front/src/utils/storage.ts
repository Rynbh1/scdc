import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const tokenStorage = {
  async setItem(key: string, value: any) {
    try {
      let valueToStore = value;
      
      if (value === null || value === undefined) {
        console.error(`Tentative de stockage d'une valeur vide pour la clé ${key}`);
        return;
      }

      if (typeof value !== 'string') {
        console.warn(`SecureStore: conversion de la valeur pour ${key} en string`);
        valueToStore = JSON.stringify(value);
      }

      await SecureStore.setItemAsync(key, valueToStore);
    } catch (error) {
      console.error("Erreur fatale SecureStore SetItem:", error);
    }
  },
  getItem: async (key: string) => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  },
  deleteItem: async (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};