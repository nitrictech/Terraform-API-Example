# Terraform API Example

A simple CDKTF application behind an API interface, as a demonstration for a [blog post](https://nitric.io/blog).

## Requirements

- Node.js
- [Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli)
- [CDKTF CLI](https://developer.hashicorp.com/terraform/tutorials/cdktf/cdktf-install)

## Installing dependencies

```bash
npm i
```
> Or your favorite alternative dependency manager

## Starting the dev server

```bash
npm run dev
```

This will server the API on `localhost:3000` by default.

##  Testing the API

You can test the API by running:

```bash
curl -X POST -H "Content-Type: application/json" -d '{ "name": "my-stack", "buckets": ["test", "test1"] }' http://localhost:3000/generate > my-stack.zip 
```

This should produce an output zip container a tf stack for deploying two s3 buckets named `test` and `test1`.

