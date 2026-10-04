import type { ReferenceDataset } from "../../../prisma/data/types";
import { alertRules } from "../../../prisma/data/alert-rules";
import { companies } from "../../../prisma/data/companies";
import { establishments } from "../../../prisma/data/establishments";
import { events } from "../../../prisma/data/events";
import { people } from "../../../prisma/data/people";
import { relations } from "../../../prisma/data/relations";
import { benchmarks } from "../../../prisma/data/benchmarks";
import { financials } from "../../../prisma/data/financials";
import { unspscClassifications } from "../../../prisma/data/unspsc";
import { initialAudit, monitoringSeed, settings, users } from "../../../prisma/data/users";
import { watchlists } from "../../../prisma/data/watchlists";
import { DataSourceNotImplemented } from "@/server/errors";

export interface DataSourceAdapter {
  loadReferenceData(): Promise<ReferenceDataset>;
}

export class DemoDataSourceAdapter implements DataSourceAdapter {
  async loadReferenceData(): Promise<ReferenceDataset> {
    return {
      companies,
      people,
      establishments,
      relations,
      events,
      alertRules,
      users,
      monitoring: monitoringSeed,
      initialAudit,
      settings,
      financials,
      unspsc: unspscClassifications,
      benchmarks,
      watchlists,
    };
  }
}

export class ApiDataSourceAdapter implements DataSourceAdapter {
  async loadReferenceData(): Promise<ReferenceDataset> {
    // Aquí entraría Registro Mercantil o ESAL reales.
    throw new DataSourceNotImplemented("api");
  }
}

export class FileDataSourceAdapter implements DataSourceAdapter {
  async loadReferenceData(): Promise<ReferenceDataset> {
    // Orígenes futuros: JSON, Excel, archivo o portal.
    throw new DataSourceNotImplemented("file");
  }
}
