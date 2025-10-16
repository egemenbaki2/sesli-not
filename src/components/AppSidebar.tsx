import { Lightbulb, Bell, Archive, Tag, Trash2, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Notlar', url: '/', icon: Lightbulb },
  { title: 'Hatırlatıcılar', url: '/reminders', icon: Bell },
  { title: 'Arşiv', url: '/archive', icon: Archive },
  { title: 'Çöp Kutusu', url: '/trash', icon: Trash2 },
  { title: 'Etiketleri Düzenle', url: '/tags', icon: Tag },
  { title: 'Ayarlar', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={isCollapsed ? 'w-16' : 'w-64 bg-zinc-800 dark:bg-zinc-900'} collapsible="offcanvas">
      <SidebarContent className="pt-4 bg-zinc-800 dark:bg-zinc-900">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="py-6">
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-primary/20 text-primary font-semibold text-base'
                          : 'hover:bg-zinc-700 dark:hover:bg-zinc-800 text-zinc-100 text-base'
                      }
                    >
                      <item.icon className="h-6 w-6" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}