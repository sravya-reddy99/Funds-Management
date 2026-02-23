export type Fund = {
  id: string; 
  name: string;
  strategies: string[];
  geographies: string[];
  currency: string;
  fundSize: number;
  vintage: number;
  managers: string[];
  description: string;
};

export type ListQuery = {
  name?: string;
  currency?: string;
  description?: string;

  strategy?: string;     
  geography?: string;    
  manager?: string;      

  fundSizeMin?: number;
  fundSizeMax?: number;
  vintageMin?: number;
  vintageMax?: number;

  sortBy?: keyof Fund;
  sortDir?: "asc" | "desc";
};