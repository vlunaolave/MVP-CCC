import type { CompanyRepository } from "@/server/repositories/interfaces";
import { RepositoryNotImplemented } from "@/server/errors";

export class ApiCompanyRepository implements CompanyRepository {
  search(): Promise<never> {
    throw new RepositoryNotImplemented();
  }

  findById(): Promise<never> {
    throw new RepositoryNotImplemented();
  }

  graph(): Promise<never> {
    throw new RepositoryNotImplemented();
  }

  finances(): Promise<never> {
    throw new RepositoryNotImplemented();
  }

  similares(): Promise<never> {
    throw new RepositoryNotImplemented();
  }

  versusSector(): Promise<never> {
    throw new RepositoryNotImplemented();
  }

  compare(): Promise<never> {
    throw new RepositoryNotImplemented();
  }

  sectors(): Promise<never> {
    throw new RepositoryNotImplemented();
  }

  sectorDetail(): Promise<never> {
    throw new RepositoryNotImplemented();
  }
}
