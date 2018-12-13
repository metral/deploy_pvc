import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export interface AppConfig {
    namespace: string;
    appName: string;

    image: string;
    size: string;
}

export const appConfig: AppConfig = {
    namespace: "default",
    appName: "nginx",

    image: "nginx:1.15-alpine",
    size: "1Gi"
};
