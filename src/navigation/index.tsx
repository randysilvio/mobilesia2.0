import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { Muat } from '../components/ui';
import { warna } from '../theme';
import LoginScreen from '../screens/LoginScreen';
import UpdateScreen from '../screens/UpdateScreen';
import HomeScreen from '../screens/HomeScreen';
import JadwalScreen from '../screens/JadwalScreen';
import KrsScreen from '../screens/KrsScreen';
import KhsScreen from '../screens/KhsScreen';
import TagihanScreen from '../screens/TagihanScreen';
import ValidasiKrsScreen from '../screens/ValidasiKrsScreen';
import DetailKrsScreen from '../screens/DetailKrsScreen';
import AbsensiScreen from '../screens/AbsensiScreen';
import KalenderScreen from '../screens/KalenderScreen';
import NotifikasiScreen from '../screens/NotifikasiScreen';
import LainnyaScreen from '../screens/LainnyaScreen';
import ProfilScreen from '../screens/ProfilScreen';
import KrsIsiScreen from '../screens/KrsIsiScreen';
import KtmScreen from '../screens/KtmScreen';
import ViconScreen from '../screens/ViconScreen';
import VerumScreen from '../screens/VerumScreen';
import VerumKelasScreen from '../screens/VerumKelasScreen';
import VerumTugasScreen from '../screens/VerumTugasScreen';
import VerumPresensiScreen from '../screens/VerumPresensiScreen';
import VerumBuatKelasScreen from '../screens/VerumBuatKelasScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

type IkonNama = React.ComponentProps<typeof Ionicons>['name'];
type TabDef = { name: string; judul: string; ikon: IkonNama; component: React.ComponentType<any> };

const kepala = {
  headerStyle: { backgroundColor: warna.gelap },
  headerTintColor: warna.putih,
  headerTitleStyle: { fontWeight: '800' as const, fontSize: 16 },
};

function tabUntuk(peran: string): TabDef[] {
  const beranda: TabDef = { name: 'BerandaTab', judul: 'Beranda', ikon: 'home-outline', component: HomeScreen };
  const lainnya: TabDef = { name: 'LainnyaTab', judul: 'Lainnya', ikon: 'menu-outline', component: LainnyaScreen };
  const verum: TabDef = { name: 'VerumTab', judul: 'Verum', ikon: 'school-outline', component: VerumScreen };
  if (peran === 'mahasiswa') {
    return [beranda,
      { name: 'JadwalTab', judul: 'Jadwal', ikon: 'calendar-outline', component: JadwalScreen },
      { name: 'KrsTab', judul: 'KRS', ikon: 'list-outline', component: KrsScreen },
      verum,
      lainnya];
  }
  if (peran === 'dosen') {
    return [beranda,
      verum,
      { name: 'ValidasiTab', judul: 'KRS', ikon: 'checkmark-done-outline', component: ValidasiKrsScreen },
      { name: 'AbsensiTab', judul: 'Absensi', ikon: 'finger-print-outline', component: AbsensiScreen },
      lainnya];
  }
  if (peran === 'pegawai' || peran === 'umum') {
    return [beranda,
      { name: 'AbsensiTab', judul: 'Absensi', ikon: 'finger-print-outline', component: AbsensiScreen },
      { name: 'KalenderTab', judul: 'Kalender', ikon: 'calendar-number-outline', component: KalenderScreen },
      lainnya];
  }
  return [beranda, { name: 'KalenderTab', judul: 'Kalender', ikon: 'calendar-number-outline', component: KalenderScreen }, lainnya];
}

function TabUtama() {
  const { peran } = useAuth();
  const tabs = tabUntuk(peran);
  return (
    <Tab.Navigator screenOptions={{
      ...kepala,
      tabBarActiveTintColor: warna.gelap,
      tabBarInactiveTintColor: warna.redup,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      tabBarStyle: { borderTopColor: warna.garis },
    }}>
      {tabs.map((t) => (
        <Tab.Screen key={t.name} name={t.name} component={t.component}
          options={{ title: t.judul, tabBarIcon: ({ color, size }) => <Ionicons name={t.ikon} size={size} color={color} /> }} />
      ))}
    </Tab.Navigator>
  );
}

const temaNavigasi = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: warna.latar, primary: warna.gelap } };

export default function Navigasi() {
  const { siap, token, perluUpdate } = useAuth();
  if (!siap) return <Muat teks="Menyiapkan SIAKAD…" />;

  return (
    <NavigationContainer theme={temaNavigasi}>
      <Stack.Navigator screenOptions={kepala}>
        {perluUpdate ? (
          <Stack.Screen name="Update" component={UpdateScreen} options={{ headerShown: false }} />
        ) : !token ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Utama" component={TabUtama} options={{ headerShown: false }} />
            <Stack.Screen name="DetailKrs" component={DetailKrsScreen} options={({ route }: any) => ({ title: route.params?.nama || 'Detail KRS' })} />
            <Stack.Screen name="KrsIsi" component={KrsIsiScreen} options={{ title: 'Isi / Ubah KRS' }} />
            <Stack.Screen name="Khs" component={KhsScreen} options={{ title: 'KHS & Transkrip' }} />
            <Stack.Screen name="Jadwal" component={JadwalScreen} options={{ title: 'Jadwal' }} />
            <Stack.Screen name="Ktm" component={KtmScreen} options={{ title: 'Kartu Tanda Mahasiswa' }} />
            <Stack.Screen name="VerumKelas" component={VerumKelasScreen} options={({ route }: any) => ({ title: route.params?.nama || 'Kelas Verum' })} />
            <Stack.Screen name="VerumTugas" component={VerumTugasScreen} options={({ route }: any) => ({ title: route.params?.nama || 'Tugas' })} />
            <Stack.Screen name="VerumPresensi" component={VerumPresensiScreen} options={({ route }: any) => ({ title: route.params?.nama || 'Presensi' })} />
            <Stack.Screen name="VerumBuatKelas" component={VerumBuatKelasScreen} options={{ title: 'Buat Kelas Verum' }} />
            <Stack.Screen name="Vicon" component={ViconScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Tagihan" component={TagihanScreen} options={{ title: 'Tagihan & Pembayaran' }} />
            <Stack.Screen name="Kalender" component={KalenderScreen} options={{ title: 'Kalender Akademik' }} />
            <Stack.Screen name="Notifikasi" component={NotifikasiScreen} options={{ title: 'Notifikasi' }} />
            <Stack.Screen name="Profil" component={ProfilScreen} options={{ title: 'Profil Saya' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
