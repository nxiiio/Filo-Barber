import { DefaultNamingStrategy, type NamingStrategyInterface } from "typeorm";

function snakeCase(value: string): string {
  return value
    .replace(/([a-z\d])([A-Z])/g, "$1_$2")
    .replace(/[\s.-]+/g, "_")
    .toLowerCase();
}

export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  override columnName(propertyName: string, customName: string | undefined, embeddedPrefixes: string[]): string {
    return snakeCase([...embeddedPrefixes, customName ?? propertyName].join("_"));
  }

  override relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  override joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(`${relationName}_${referencedColumnName}`);
  }
}
