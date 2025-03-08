import { useContext } from "react";
import { useQuery } from "react-query";
import RegistryPathContext from "../contexts/RegistryPathContext";
import { FEAST_FCO_TYPES } from "../parsers/types";
import useLoadRegistry from "./useLoadRegistry";

interface FeastObject {
  type: FEAST_FCO_TYPES;
  name: string;
}

interface Relationship {
  source: FeastObject;
  target: FeastObject;
  type: string;
}

const useLoadRelationshipData = () => {
  const registryUrl = useContext(RegistryPathContext);
  const registryQuery = useLoadRegistry(registryUrl);

  return useQuery<Relationship[], Error>(
    ["relationships", registryUrl],
    () => {
      if (!registryQuery.isSuccess) {
        return [];
      }

      const registry = registryQuery.data;
      if (!registry) {
        return [];
      }

      const relationships: Relationship[] = [];

      // Process Data Sources to Feature Views
      if (registry.objects?.dataSources && registry.objects?.featureViews) {
        registry.objects.featureViews.forEach((featureView: any) => {
          const dataSourceName = featureView.spec?.batchSource?.name;
          if (dataSourceName) {
            relationships.push({
              source: {
                type: FEAST_FCO_TYPES.dataSource,
                name: dataSourceName,
              },
              target: {
                type: FEAST_FCO_TYPES.featureView,
                name: featureView.spec?.name,
              },
              type: "provides-data",
            });
          }
        });
      }

      // Process Entities to Feature Views
      if (registry.objects?.entities && registry.objects?.featureViews) {
        registry.objects.featureViews.forEach((featureView: any) => {
          const entities = featureView.spec?.entities || [];
          entities.forEach((entityName: string) => {
            relationships.push({
              source: {
                type: FEAST_FCO_TYPES.entity,
                name: entityName,
              },
              target: {
                type: FEAST_FCO_TYPES.featureView,
                name: featureView.spec?.name,
              },
              type: "used-by",
            });
          });
        });
      }

      // Process Feature Views to Feature Services
      if (registry.objects?.featureViews && registry.objects?.featureServices) {
        registry.objects.featureServices.forEach((featureService: any) => {
          const featureViewRefs = featureService.spec?.features || [];
          const processedFeatureViews = new Set<string>();

          featureViewRefs.forEach((featureRef: any) => {
            const featureViewName = featureRef.featureView;
            if (featureViewName && !processedFeatureViews.has(featureViewName)) {
              processedFeatureViews.add(featureViewName);
              relationships.push({
                source: {
                  type: FEAST_FCO_TYPES.featureView,
                  name: featureViewName,
                },
                target: {
                  type: FEAST_FCO_TYPES.featureService,
                  name: featureService.spec?.name,
                },
                type: "consumed-by",
              });
            }
          });
        });
      }

      return relationships;
    },
    {
      enabled: registryQuery.isSuccess,
    }
  );
};

export default useLoadRelationshipData;
