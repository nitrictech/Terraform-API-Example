import { Construct } from "constructs";
import { App, TerraformStack, TerraformVariable } from "cdktf";
import express from "express";
import short from "short-uuid";
import fs from 'fs';
import archiver from 'archiver';
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";

const PORT = process.env.PORT || 3000;

const server = express();
server.use(express.json());

export interface StackRequest {
  name: string;
  buckets: string[];
  region: string;
}

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string, req: StackRequest) {
    super(scope, id);

    const region = new TerraformVariable(this, "region", {
      type: "string",
      description: "The AWS region to deploy the stack to",
    });

    // configure the aws provider
    new AwsProvider(this, "aws", {
      region: region.stringValue,
    });
    
    req.buckets.forEach((bucketName) => {
      // deploy an aws s3 bucket
      new S3Bucket(this, bucketName, {
        bucket: bucketName,
      });
    });

    // define resources here
    console.log("deploying buckets", req.buckets);
  }
}

function zipDirectory(sourceDir: string, outPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve(outPath));
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
  });
}

server.post("/generate", async (req, res) => {
  const deploymentSpec = req.body; // Assuming body structure is validated

  console.log('Deploying', deploymentSpec);

  const uniqueId = short.generate();
  const outputDir = `./${uniqueId}`;

  // Generate Terraform configuration
  const app = new App({
    outdir: outputDir,
  });
  new MyStack(app, deploymentSpec.name, deploymentSpec);
  app.synth();

  // Zip the generated Terraform configuration
  const zipPath = await zipDirectory(`${outputDir}/stacks/${deploymentSpec.name}`, `${outputDir}.zip`);

  // Send the zip file as a response
  res.download(zipPath, async (err) => {
    if (err) {
        console.error('Error sending the zip file:', err);
        res.status(500).send('Error generating Terraform configuration');
    } 

    // cleanup generated output and zip file
    await fs.promises.rmdir(outputDir, { recursive: true });
    await fs.promises.rm(zipPath);
  });
});

server.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
