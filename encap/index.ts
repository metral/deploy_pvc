import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as input from "@pulumi/kubernetes/types/input";
import { AppConfig, appConfig } from "./config";

function defaultLabels(appConfig: AppConfig): any {
    return { app: appConfig.appName };
}

export function makePersistentVolumeClaim(appConfig: AppConfig): k8s.core.v1.PersistentVolumeClaim {
    const labels = defaultLabels(appConfig);
    return new k8s.core.v1.PersistentVolumeClaim(appConfig.appName, {
        metadata: {
            name: appConfig.appName,
            namespace: appConfig.namespace,
        },
        spec: {
		    accessModes: ["ReadWriteOnce"],
            resources: {
                requests: {
                    storage: appConfig.size
                }
            }
        }
    });
}

namespace deployment {
    export function makePersistent(
        appConfig: AppConfig,
    ): k8s.apps.v1.Deployment {
        const volume = {
            name: "data",
            persistentVolumeClaim: {
                claimName: appConfig.appName
            }
        };
        const dep = base(appConfig);
        (<any>dep).spec.template.spec.volumes.push(volume);
        (<any>dep).spec.template.spec.containers.map((c: any) => {
            if (c.name == appConfig.appName) {
                c.volumeMounts.push({
                    name: "data",
                    mountPath: "/opt/data"
                });
            }
            return c;
        });
        return new k8s.apps.v1.Deployment(appConfig.appName, dep);
    }

    const base = (
        appConfig: AppConfig,
    ): input.apps.v1.Deployment => {
        const labels = defaultLabels(appConfig);

        return {
            metadata: {
                name: appConfig.appName,
                namespace: appConfig.namespace,
                labels: labels
            },
            spec: {
                selector: {
                    matchLabels: labels
                },
                template: {
                    metadata: {
                        namespace: appConfig.namespace,
                        labels: labels
                    },
                    spec: {
                        containers: [
                            {
                                name: appConfig.appName,
                                image: appConfig.image,
                                volumeMounts: []
                            },
                        ],
                        volumes: []
                    }
                }
            }
        };
    };
}

const pvc = makePersistentVolumeClaim(appConfig);
const deploy = deployment.makePersistent(appConfig);
