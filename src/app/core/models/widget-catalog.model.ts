export interface WidgetCatalogEntry {
  id: string;
  title: string;
  category: string[];
  hasSidebarComponent: boolean;
  hasDetailView: boolean;
  hidden?: boolean;
}

export interface WidgetsCatalog {
  widgets: WidgetCatalogEntry[];
}
